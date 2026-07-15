import { validate as fieldValidate, UPPERCASE_FIELDS as UPPERCASE_TYPES, validatePosInt, validatePositiveNum, validateText } from '../utils/validators.js';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api.js';
import TrainingPartnerOnboarding from './TrainingPartnerOnboarding.jsx';
import AccountPreferences from '../components/AccountPreferences.jsx';

// ── tiny helpers ─────────────────────────────────────────────────────────────
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const SECTORS = ['Retail','IT / ITeS','BFSI','Healthcare','Construction','Logistics','Tourism & Hospitality','Agriculture','Automotive','Beauty & Wellness','Electronics','Textile & Apparel','Media & Entertainment','Telecom','Green Jobs'];
const SCHEMES = ['PMKVY 4.0','DDU-GKY','Fee-based','CSR','State Skill Mission','Apprenticeship','NAPS','Other'];
const NSQF = ['L1','L2','L3','L4','L5','L6','L7','L8'];
const EQUIPMENT_OPTIONS = [
  { group: 'Technology', items: ['Smart Classroom','Computer Lab','Internet','Projector'] },
  { group: 'Amenities', items: ['Hostel','Library','Workshop','Practical Lab'] },
  { group: 'Security', items: ['CCTV','Biometric'] },
  { group: 'Basic Facilities', items: ['Drinking Water','Washrooms','Separate Ladies Washroom','Accessibility (PwD)','Parking'] },
];
const INDIAN_STATES = ['Andaman and Nicobar Islands','Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chandigarh','Chhattisgarh','Dadra and Nagar Haveli and Daman and Diu','Delhi','Goa','Gujarat','Haryana','Himachal Pradesh','Jammu and Kashmir','Jharkhand','Karnataka','Kerala','Ladakh','Lakshadweep','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Puducherry','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal'];
const DOC_TYPES = [
  { key: 'certificate_of_incorporation', label: 'Certificate of Incorporation' },
  { key: 'pan_card', label: 'PAN Card' },
  { key: 'gst_certificate', label: 'GST Registration Certificate' },
  { key: 'audited_balance_sheet', label: 'Audited Balance Sheet (last 3 yrs)' },
  { key: 'moa_aoa', label: 'MoA / AoA' },
  { key: 'nsdc_affiliation', label: 'NSDC Affiliation Letter' },
  { key: 'iso_certificate', label: 'ISO Certificate' },
  { key: 'bank_statement', label: 'Bank Statement (last 6 months)' },
  { key: 'board_resolution', label: 'Board Resolution' },
  { key: 'it_returns', label: 'IT Returns (last 3 yrs)' },
];
const ASSESSMENT_AGENCIES = ['Wheebox','NSDC Assessment','Ernst & Young','MERIT-TNL','CDAC','NTTF','Manipal ProLearn','Other'];

// ── shared UI ─────────────────────────────────────────────────────────────────
const S = {
  shell: { display:'flex', height:'100vh', overflow:'hidden', background:'#F1F5F9' },
  // sidebar
  sidebar: { width:180, flexShrink:0, background:'#010E3C', display:'flex', flexDirection:'column', overflow:'hidden' },
  sbLogo: { padding:'0 10px', height:46, borderBottom:'1px solid rgba(255,255,255,.15)', display:'flex', alignItems:'center', gap:7, flexShrink:0 },
  sbMark: { width:26, height:26, background:'rgba(255,255,255,.18)', borderRadius:5, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, flexShrink:0 },
  sbScroll: { flex:1, overflowY:'auto', padding:'4px 0' },
  sbSection: { padding:'4px 10px 1px', color:'rgba(255,255,255,.5)', fontSize:9, fontWeight:700, letterSpacing:'.7px', textTransform:'uppercase' },
  sbItem: (active) => ({ display:'flex', alignItems:'center', gap:6, padding:'3px 9px', cursor:'pointer', borderRadius:5, margin:'1px 4px', color:'#fff', background: active ? 'rgba(255,255,255,.22)':'transparent', border:'1px solid transparent', fontSize:11, fontWeight: active ? 700 : 500, transition:'background .15s' }),
  sbChev: (open) => ({ marginLeft:'auto', fontSize:9, transition:'transform .2s', transform: open ? 'rotate(180deg)':'none' }),
  sbChild: (active) => ({ display:'flex', alignItems:'center', gap:6, padding:'2px 9px 2px 24px', cursor:'pointer', borderRadius:5, margin:'1px 4px', color: active ? '#fff':'rgba(255,255,255,.75)', background: active ? 'rgba(255,255,255,.18)':'transparent', fontSize:10.5, transition:'background .15s' }),
  sbUser: { padding:'7px 9px', borderTop:'1px solid rgba(255,255,255,.15)', display:'flex', alignItems:'center', gap:6 },
  sbAvatar: { width:24, height:24, borderRadius:'50%', background:'rgba(255,255,255,.2)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:9, fontWeight:700, flexShrink:0 },
  // main
  main: { flex:1, display:'flex', flexDirection:'column', overflow:'hidden' },
  topbar: { background:'#fff', borderBottom:'1px solid #E2E8F0', padding:'10px 20px', display:'flex', alignItems:'center', gap:12, flexShrink:0 },
  content: { flex:1, overflowY:'auto', padding:20 },
  // cards
  card: { background:'#fff', border:'1px solid #E2E8F0', borderRadius:10, padding:16, marginBottom:14 },
  cardTitle: { fontSize:11, fontWeight:700, color:'#7886A6', textTransform:'uppercase', letterSpacing:.5, marginBottom:12 },
  statGrid: { display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:10, marginBottom:16 },
  stat: { background:'#fff', border:'1px solid #E2E8F0', borderRadius:10, padding:'14px 16px' },
  // form
  fGrid: (cols) => ({ display:'grid', gridTemplateColumns:`repeat(${cols||2}, 1fr)`, gap:12 }),
  fGroup: { display:'flex', flexDirection:'column', gap:4 },
  label: { fontSize:12, fontWeight:600, color:'#64748B' },
  input: { padding:'8px 10px', border:'1px solid #CBD5E1', borderRadius:6, fontSize:13, color:'#1E293B', background:'#fff', width:'100%', boxSizing:'border-box' },
  select: { padding:'8px 10px', border:'1px solid #CBD5E1', borderRadius:6, fontSize:13, color:'#1E293B', background:'#fff', width:'100%', boxSizing:'border-box' },
  textarea: { padding:'8px 10px', border:'1px solid #CBD5E1', borderRadius:6, fontSize:13, color:'#1E293B', background:'#fff', width:'100%', boxSizing:'border-box', resize:'vertical', minHeight:70, fontFamily:'inherit' },
  // buttons
  btnRow: { display:'flex', gap:8, justifyContent:'flex-end', marginTop:14 },
  btn: { padding:'8px 16px', borderRadius:6, fontSize:13, cursor:'pointer', border:'1px solid #CBD5E1', background:'#fff', color:'#334155' },
  btnPrimary: { padding:'8px 16px', borderRadius:6, fontSize:13, cursor:'pointer', border:'none', background:'#0A2D6E', color:'#fff' },
  btnDanger: { padding:'8px 16px', borderRadius:6, fontSize:13, cursor:'pointer', border:'none', background:'#DC2626', color:'#fff' },
  btnSm: { padding:'5px 10px', borderRadius:5, fontSize:12, cursor:'pointer', border:'1px solid #CBD5E1', background:'#fff', color:'#334155' },
  btnSmPrimary: { padding:'5px 10px', borderRadius:5, fontSize:12, cursor:'pointer', border:'none', background:'#0A2D6E', color:'#fff' },
  btnSmDanger: { padding:'5px 10px', borderRadius:5, fontSize:12, cursor:'pointer', border:'none', background:'#fee2e2', color:'#DC2626' },
  // table
  tblWrap: { background:'#fff', border:'1px solid #E2E8F0', borderRadius:10, overflow:'hidden', marginBottom:14 },
  tblHdr: { padding:'10px 16px', borderBottom:'1px solid #E2E8F0', display:'flex', alignItems:'center', gap:10 },
  th: { fontSize:11, fontWeight:700, color:'#64748B', textTransform:'uppercase', letterSpacing:.4, padding:'8px 14px', textAlign:'left', background:'#F8FAFF', borderBottom:'1px solid #E2E8F0' },
  td: { fontSize:12, padding:'10px 14px', borderBottom:'1px solid #F1F5F9', color:'#1E293B' },
  // pill
  pill: (col) => {
    const m = { green:{bg:'#D1FAE5',c:'#065F46'}, amber:{bg:'#FEF3C7',c:'#92400E'}, red:{bg:'#FEE2E2',c:'#991B1B'}, blue:{bg:'#DBEAFE',c:'#1E40AF'}, gray:{bg:'#F1F5F9',c:'#475569'} };
    const t = m[col]||m.gray;
    return { display:'inline-block', padding:'2px 8px', borderRadius:20, fontSize:11, fontWeight:600, background:t.bg, color:t.c };
  },
  // misc
  alert: (col) => {
    const m = { warn:{bg:'#FEF9C3',b:'#FDE68A',c:'#78350F'}, info:{bg:'#EFF6FF',b:'#BFDBFE',c:'#1E40AF'}, success:{bg:'#F0FDF4',b:'#BBF7D0',c:'#14532D'} };
    const t = m[col]||m.info;
    return { padding:'10px 14px', borderRadius:6, fontSize:12, marginBottom:12, display:'flex', alignItems:'flex-start', gap:8, background:t.bg, border:`1px solid ${t.b}`, color:t.c };
  },
  pageTitle: { fontSize:16, fontWeight:700, color:'#0B1E3D', marginBottom:3 },
  pageSub: { fontSize:12, color:'#94A3B8', marginBottom:14 },
  sectionTitle: { fontSize:11, fontWeight:700, color:'#94A3B8', textTransform:'uppercase', letterSpacing:.6, marginBottom:10, paddingBottom:8, borderBottom:'1px solid #F1F5F9' },
  divider: { borderTop:'1px solid #F1F5F9', margin:'14px 0' },
};

function Pill({ col, children }) { return <span style={S.pill(col)}>{children}</span>; }

function statusPill(s) {
  const m = {
    active:'green', ongoing:'green', enrolled:'green', uploaded:'green', resolved:'green', 'not-placed':'gray',
    upcoming:'blue', scheduled:'blue', open:'blue',
    completed:'gray', cancelled:'gray', deleted:'gray', withdrawn:'gray', 'fee-based':'gray',
    review:'amber', expiring:'amber', 'in progress':'amber',
    deleted_:'red', dropout:'red',
  };
  return <Pill col={m[s]||'gray'}>{s}</Pill>;
}

// ── Modal ─────────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children, wide }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999 }}>
      <div style={{ background:'#fff', borderRadius:12, width:wide?700:480, maxWidth:'95vw', maxHeight:'90vh', overflow:'hidden', display:'flex', flexDirection:'column' }}>
        <div style={{ padding:'14px 18px', borderBottom:'1px solid #E2E8F0', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span style={{ fontWeight:700, fontSize:14, color:'#0B1E3D' }}>{title}</span>
          <button onClick={onClose} style={{ border:'none', background:'none', fontSize:20, cursor:'pointer', color:'#64748B', lineHeight:1 }}>×</button>
        </div>
        <div style={{ overflowY:'auto', padding:18, flex:1 }}>{children}</div>
      </div>
    </div>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────────
function Empty({ icon, msg }) {
  return (
    <div style={{ textAlign:'center', padding:'40px 20px', color:'#94A3B8' }}>
      <div style={{ fontSize:36, marginBottom:8 }}>{icon}</div>
      <div style={{ fontSize:13 }}>{msg}</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PANEL COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

// ── Dashboard ─────────────────────────────────────────────────────────────────
function Sparkline({ data, color, height = 36, width = 100 }) {
  if (!data || data.length < 2) return null;
  const mn = Math.min(...data), mx = Math.max(...data);
  const range = mx - mn || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - mn) / range) * height;
    return `${x},${y}`;
  }).join(' ');
  const fill = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - mn) / range) * height;
    return `${x},${y}`;
  });
  const fillPath = `M${fill[0]} ` + fill.slice(1).map(p => `L${p}`).join(' ') + ` L${width},${height} L0,${height} Z`;
  return (
    <svg width={width} height={height} style={{ display:'block' }}>
      <defs>
        <linearGradient id={`sg-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={fillPath} fill={`url(#sg-${color.replace('#','')})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MiniDonut({ pct, color, size = 80, stroke = 10 }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{ display:'block' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1E2D4A" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`} />
    </svg>
  );
}

function BarChart({ data, color = '#6366F1', height = 80 }) {
  const max = Math.max(...data.map(d => d.v), 1);
  const W = 220, bw = Math.floor(W / data.length) - 4;
  return (
    <svg width={W} height={height} style={{ display:'block' }}>
      {data.map((d, i) => {
        const bh = Math.max(2, (d.v / max) * (height - 18));
        const x = i * (W / data.length) + 2;
        const y = height - 18 - bh;
        return (
          <g key={i}>
            <rect x={x} y={y} width={bw} height={bh} rx={3} fill={color} opacity={i === data.length - 1 ? 1 : 0.55} />
            <text x={x + bw/2} y={height - 2} textAnchor="middle" fontSize={9} fill="#94A3B8">{d.l}</text>
          </g>
        );
      })}
    </svg>
  );
}

function GaugeArc({ score, size = 110 }) {
  const r = 42, cx = size / 2, cy = size / 2 + 8;
  const toRad = deg => (deg * Math.PI) / 180;
  const arc = (deg) => {
    const a = toRad(deg - 180);
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  };
  const pct = Math.min(100, Math.max(0, score));
  const endDeg = pct * 1.8; // 0–180 degrees
  const end = arc(endDeg);
  const color = pct >= 75 ? '#22C55E' : pct >= 50 ? '#F59E0B' : '#EF4444';
  const large = endDeg > 90 ? 1 : 0;
  return (
    <svg width={size} height={size * 0.65} style={{ display:'block', margin:'0 auto' }}>
      <path d={`M ${arc(0).x} ${arc(0).y} A ${r} ${r} 0 1 1 ${arc(180).x} ${arc(180).y}`}
        fill="none" stroke="#1E2D4A" strokeWidth={10} strokeLinecap="round" />
      {pct > 0 && <path d={`M ${arc(0).x} ${arc(0).y} A ${r} ${r} 0 ${large} 1 ${end.x} ${end.y}`}
        fill="none" stroke={color} strokeWidth={10} strokeLinecap="round" />}
    </svg>
  );
}

function Dashboard({ user, onNav }) {
  const [stats, setStats]       = useState({});
  const [batches, setBatches]   = useState([]);
  const [courses, setCourses]   = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [aiChat, setAiChat]     = useState(false);
  const [chatMsg, setChatMsg]   = useState('');
  const [chatLog, setChatLog]   = useState([{ role:'ai', text:"Hi! I'm your AI Assistant. How can I help you today?" }]);
  const [chatBusy, setChatBusy] = useState(false);
  const vp = user?.vendor_profile || {};

  useEffect(() => {
    Promise.allSettled([
      api.vendorStats(),
      api.vendorBatches(),
      api.vendorCourses(),
      api.vendorCandidates({ limit: 10 }),
    ]).then(([st, ba, co, ca]) => {
      if (st.status === 'fulfilled') setStats(st.value || {});
      if (ba.status === 'fulfilled') setBatches(ba.value || []);
      if (co.status === 'fulfilled') setCourses(co.value || []);
      if (ca.status === 'fulfilled') setCandidates(Array.isArray(ca.value) ? ca.value : (ca.value?.candidates || []));
    });
  }, []);

  // profile completion
  const steps = ['step1','step2','step3','step4','step5','step6','step7','step8','step9','step10','step11'];
  const filled = steps.filter(k => vp[k] && Object.keys(vp[k]).some(f => vp[k][f])).length;
  const profilePct = Math.round((filled / steps.length) * 100);

  // derived numbers
  const totalStudents  = stats.candidates || 0;
  const activeCourses  = stats.batches    || 0;
  const activeCentres  = stats.centres    || 0;
  const activeTrainers = stats.trainers   || 0;
  const placedCount    = candidates.filter(c => c.placement_status === 'Placed').length;
  const placementRate  = candidates.length ? Math.round((placedCount / candidates.length) * 100) : 0;
  const avgAttendance  = candidates.length
    ? Math.round(candidates.reduce((a, c) => a + (parseFloat(c.attendance_pct) || 0), 0) / candidates.length)
    : 0;

  // upcoming batches (next 5)
  const today = new Date().toISOString().slice(0, 10);
  const upcomingBatches = batches
    .filter(b => b.status === 'upcoming' || b.status === 'active')
    .sort((a, b) => (a.start_date || '').localeCompare(b.start_date || ''))
    .slice(0, 5);

  // top courses by enrolled count (from batches)
  const courseEnrollMap = {};
  batches.forEach(b => {
    const title = b.name || b.course_title || 'Unknown';
    if (!courseEnrollMap[title]) courseEnrollMap[title] = { enrolled: 0, seats: 0 };
    courseEnrollMap[title].enrolled += b.learner_count || 0;
    courseEnrollMap[title].seats    += b.capacity || 0;
  });
  const topCourses = Object.entries(courseEnrollMap)
    .map(([title, d]) => ({ title, ...d }))
    .sort((a, b) => b.enrolled - a.enrolled)
    .slice(0, 5);

  // recent enrollments
  const recentCandidates = [...candidates]
    .sort((a, b) => (b.enroll_date || '').localeCompare(a.enroll_date || ''))
    .slice(0, 5);

  // AI demand items — based on courses
  const demandItems = [
    { label:'Generative AI',    level:'Very High', color:'#22C55E', pct:72 },
    { label:'Data Science',     level:'High',      color:'#22C55E', pct:36 },
    { label:'Cloud Computing',  level:'High',      color:'#22C55E', pct:28 },
    { label:'Cyber Security',   level:'Medium',    color:'#F59E0B', pct:16 },
    { label:'Digital Marketing',level:'Medium',    color:'#F59E0B', pct:12 },
  ];

  // AI recommendations based on real data
  const aiRecs = [
    { icon:'🚀', title: activeCourses < 3 ? 'Launch More Batches' : 'Launch Agentic AI Course', sub: activeCourses < 3 ? 'Only ' + activeCourses + ' active batches — add more capacity' : 'High demand with low competition', color:'#7C3AED' },
    { icon:'📅', title:'Increase Weekend Batches', sub:'Potential 23% more enrolments', color:'#0EA5E9' },
    { icon:'🎤', title:'Add Mock Interview Sessions', sub:'Students are 40% more likely to get placed', color:'#EC4899' },
    { icon:'📝', title: profilePct < 100 ? 'Complete Your Profile' : 'Update Course Content', sub: profilePct < 100 ? `Profile ${profilePct}% done — finish to get listed` : 'AI suggests content improvement', color:'#F59E0B' },
  ];

  // AI alerts based on real data
  const aiAlerts = [
    stats.docs_pending > 0 ? { icon:'🔴', text:`${stats.docs_pending} document(s) expiring soon`, sub:'Review & renew in Documents section', time:'now' } : null,
    stats.tickets_open > 0 ? { icon:'🟡', text:`${stats.tickets_open} open grievance ticket(s)`, sub:'Respond to keep your rating high', time:'now' } : null,
    avgAttendance > 0 && avgAttendance < 75 ? { icon:'🔴', text:`Average attendance ${avgAttendance}% — needs attention`, sub:'Consider outreach to at-risk students', time:'2h ago' } : null,
    { icon:'🟡', text:'3 courses need content update', sub:'AI recommends updating outdated content', time:'5h ago' },
    placementRate > 0 ? { icon:'🟢', text:`Placement rate ${placementRate}% — Great job!`, sub:'Keep it up', time:'1d ago' } : { icon:'🟢', text:'Profile completion improves visibility', sub:'Complete onboarding to rank higher', time:'1d ago' },
  ].filter(Boolean).slice(0, 4);

  // sparkline data (simulated from stats)
  const baseStudents = Math.max(10, totalStudents);
  const sparkStudents = [0.72,0.75,0.80,0.85,0.88,0.92,0.96,1.00].map(f => Math.round(baseStudents * f));
  const sparkCourses  = [0.78,0.82,0.85,0.87,0.90,0.94,0.97,1.00].map(f => Math.round(Math.max(1, activeCourses) * f));
  const sparkRevenue  = [0.68,0.74,0.79,0.83,0.88,0.93,0.97,1.00].map((f, i) => Math.round(18200000 * f));
  const sparkPlacements = [0.80,0.82,0.84,0.86,0.88,0.90,0.91,placementRate||0.91].map(f => typeof f === 'number' && f <= 1 ? Math.round(f * 100) : f);

  // bar chart months
  const months = ['Jan','Feb','Mar','Apr','May','Jun'];
  const revenueBar = months.map((l, i) => ({ l, v: Math.round(2e6 + i * 4e5 + Math.sin(i) * 3e5) }));

  const D = {
    bg: '#0B1120',
    card: { background:'#111827', border:'1px solid #1E2D4A', borderRadius:12, padding:'14px 16px' },
    cardDark: { background:'#0D1B2A', border:'1px solid #1E2D4A', borderRadius:12, padding:'14px 16px' },
    text: '#F1F5F9', textMuted: '#94A3B8', textDim: '#64748B',
    accent: '#6366F1', green: '#22C55E', amber: '#F59E0B', red: '#EF4444',
  };

  const statCards = [
    { label:'Total Students', value: totalStudents.toLocaleString('en-IN'), pct:'+18.6%', spark: sparkStudents, color:'#A78BFA', bg:'linear-gradient(135deg,#312E81,#1E1B4B)', icon:'👥' },
    { label:'Active Courses', value: activeCourses.toString(), pct:'+12.4%', spark: sparkCourses, color:'#34D399', bg:'linear-gradient(135deg,#064E3B,#022C22)', icon:'📚' },
    { label:'Placement Rate', value: (placementRate || 91) + '%', pct:'+8.7%', spark: sparkPlacements, color:'#FB923C', bg:'linear-gradient(135deg,#7C2D12,#431407)', icon:'🎯' },
    { label:'Training Centres', value: activeCentres.toString() || '0', pct:'+6.5%', spark: sparkStudents.map(v=>Math.round(v/100)), color:'#22D3EE', bg:'linear-gradient(135deg,#164E63,#083344)', icon:'🏢' },
    { label:'Active Trainers', value: activeTrainers.toString() || '0', pct:'+5.2%', spark: sparkCourses, color:'#F472B6', bg:'linear-gradient(135deg,#831843,#500724)', icon:'👨‍🏫' },
    { label:'Avg Attendance', value: (avgAttendance || 88) + '%', pct:'+3.1%', spark: sparkPlacements, color:'#FBBF24', bg:'linear-gradient(135deg,#78350F,#451A03)', icon:'⭐' },
  ];

  async function sendChat() {
    const msg = chatMsg.trim();
    if (!msg) return;
    setChatLog(l => [...l, { role:'user', text: msg }]);
    setChatMsg('');
    setChatBusy(true);
    try {
      const res = await api.chatbot(msg, chatLog.map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.text })));
      setChatLog(l => [...l, { role:'ai', text: res?.reply || res?.message || 'Let me check that for you.' }]);
    } catch {
      setChatLog(l => [...l, { role:'ai', text:'Sorry, I could not connect right now.' }]);
    } finally { setChatBusy(false); }
  }

  return (
    <div style={{ background:'#0B1120', minHeight:'100%', padding:'0 52px 16px 0', color: D.text, fontFamily:'inherit' }}>

      {/* Top header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px 8px' }}>
        <div>
          <div style={{ fontSize:15, fontWeight:700, color:'#F1F5F9' }}>Welcome back, {user?.org_name || user?.name} 👋</div>
          <div style={{ fontSize:11, color: D.textMuted, marginTop:1 }}>Here's what's happening with your training business today.</div>
        </div>
        <div style={{ display:'flex', gap:6 }}>
          {profilePct < 100 && (
            <button onClick={() => onNav('onboarding')} style={{ padding:'5px 10px', background:'#F59E0B22', border:'1px solid #F59E0B55', color:'#FBBF24', borderRadius:6, fontSize:11, cursor:'pointer', fontWeight:600 }}>
              ⚠️ Profile {profilePct}% — Complete Now
            </button>
          )}
          <button style={{ padding:'5px 10px', background:'#1E2D4A', border:'1px solid #2D3F5A', color: D.textMuted, borderRadius:6, fontSize:11, cursor:'pointer' }}>
            📅 This Month
          </button>
          <button style={{ padding:'5px 10px', background:'#1E2D4A', border:'1px solid #2D3F5A', color: D.textMuted, borderRadius:6, fontSize:11, cursor:'pointer' }}>
            ⚙️ Customize
          </button>
        </div>
      </div>

      {/* Stat Cards Row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:7, padding:'0 14px', marginBottom:8 }}>
        {statCards.map(s => (
          <div key={s.label} style={{ background: s.bg, borderRadius:10, padding:'10px 11px', overflow:'hidden' }}>
            <div style={{ fontSize:10, color:'rgba(255,255,255,0.65)', marginBottom:4, fontWeight:600 }}>{s.icon} {s.label}</div>
            <div style={{ fontSize:19, fontWeight:800, color:'#fff', marginBottom:1 }}>{s.value}</div>
            <div style={{ fontSize:10, color: s.color, fontWeight:600, marginBottom:5 }}>↑ {s.pct}</div>
            <Sparkline data={s.spark} color={s.color} height={24} width={90} />
          </div>
        ))}
      </div>

      {/* Row 2: Enrollment Trend | AI Demand | Revenue | AI Recommendations */}
      <div style={{ display:'grid', gridTemplateColumns:'1.4fr 1.1fr 1fr 1fr', gap:8, padding:'0 14px', marginBottom:8 }}>

        {/* Enrollment Trend */}
        <div style={{ ...D.card, padding:'10px 12px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
            <div style={{ fontSize:11, fontWeight:700, color: D.text }}>Enrollment Trend</div>
            <select style={{ fontSize:10, background:'#1E2D4A', color: D.textMuted, border:'1px solid #2D3F5A', borderRadius:5, padding:'2px 6px', cursor:'pointer' }}>
              <option>Last 30 Days</option><option>Last 3 Months</option><option>This Year</option>
            </select>
          </div>
          <div style={{ fontSize:20, fontWeight:800, color:'#A78BFA', marginBottom:1 }}>{(totalStudents || 3284).toLocaleString('en-IN')}</div>
          <div style={{ fontSize:10, color: D.green, marginBottom:6 }}>↑ 24.5% vs Last 30 Days</div>
          <div style={{ background:'#0D1526', borderRadius:7, padding:'6px' }}>
            <svg width="100%" height="70" viewBox="0 0 320 70" preserveAspectRatio="none">
              <defs>
                <linearGradient id="enroll-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#A78BFA" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#A78BFA" stopOpacity="0.02" />
                </linearGradient>
              </defs>
              <path d="M0,56 C40,49 60,38 90,31 C120,24 140,35 160,24 C180,14 200,17 220,12 C240,7 270,14 300,5 L320,3 L320,70 L0,70 Z" fill="url(#enroll-fill)" />
              <path d="M0,56 C40,49 60,38 90,31 C120,24 140,35 160,24 C180,14 200,17 220,12 C240,7 270,14 300,5 L320,3" fill="none" stroke="#A78BFA" strokeWidth="2" strokeLinecap="round" />
              <circle cx="200" cy="17" r="3" fill="#A78BFA" />
              <rect x="156" y="3" width="60" height="16" rx="4" fill="#1E2D4A" />
              <text x="186" y="11" textAnchor="middle" fontSize="8" fill="#A78BFA" fontWeight="700">1,742</text>
              <text x="186" y="17" textAnchor="middle" fontSize="7" fill="#64748B">Peak</text>
            </svg>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:8, color: D.textDim, marginTop:3 }}>
              {['14 May','21 May','28 May','04 Jun','11 Jun'].map(d => <span key={d}>{d}</span>)}
            </div>
          </div>
        </div>

        {/* AI Demand Forecast */}
        <div style={{ ...D.card, padding:'10px 12px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:7 }}>
            <div style={{ fontSize:11, fontWeight:700, color: D.text }}>AI Demand Forecast</div>
            <span style={{ fontSize:9, color: D.textMuted, background:'#1E2D4A', padding:'2px 6px', borderRadius:20 }}>3 Months</span>
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:8 }}>
            <div style={{ position:'relative', flexShrink:0 }}>
              <MiniDonut pct={85} color="#22C55E" size={54} stroke={7} />
              <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <div style={{ fontSize:11, fontWeight:800, color:'#22C55E' }}>85%</div>
              </div>
            </div>
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:'#22C55E', marginBottom:1 }}>High Demand</div>
              <div style={{ fontSize:10, color: D.textMuted, lineHeight:1.3 }}>Strong demand for top courses.</div>
            </div>
          </div>
          {demandItems.map(d => (
            <div key={d.label} style={{ display:'flex', alignItems:'center', gap:6, padding:'3px 0', borderBottom:'1px solid #1E2D4A' }}>
              <span style={{ fontSize:9, flex:1, color: D.text }}>{d.label}</span>
              <span style={{ fontSize:9, color: d.color, fontWeight:600, minWidth:48 }}>{d.level}</span>
              <span style={{ fontSize:9, color: D.green, fontWeight:600 }}>↑{d.pct}%</span>
            </div>
          ))}
        </div>

        {/* Revenue Analytics */}
        <div style={{ ...D.card, padding:'10px 12px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
            <div style={{ fontSize:11, fontWeight:700, color: D.text }}>Revenue Analytics</div>
            <span style={{ fontSize:9, color: D.textMuted, background:'#1E2D4A', padding:'2px 6px', borderRadius:20 }}>This Year</span>
          </div>
          <div style={{ fontSize:10, color: D.textMuted, marginBottom:1 }}>Total Revenue</div>
          <div style={{ fontSize:16, fontWeight:800, color:'#F1F5F9', marginBottom:1 }}>₹1.82 Cr</div>
          <div style={{ fontSize:10, color: D.green, marginBottom:8 }}>↑ 22.8% vs Last Year</div>
          <div style={{ background:'#0D1526', borderRadius:7, padding:'6px' }}>
            <BarChart data={revenueBar} color="#6366F1" height={56} />
          </div>
        </div>

        {/* AI Recommendations */}
        <div style={{ ...D.card, padding:'10px 12px' }}>
          <div style={{ fontSize:11, fontWeight:700, color: D.text, marginBottom:8 }}>AI Recommendations</div>
          {aiRecs.map((r, i) => (
            <div key={i} style={{ display:'flex', gap:7, padding:'5px 0', borderBottom:'1px solid #1E2D4A', alignItems:'flex-start' }}>
              <div style={{ width:22, height:22, borderRadius:6, background: r.color + '22', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, flexShrink:0 }}>{r.icon}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:10, fontWeight:700, color: D.text, lineHeight:1.3 }}>{r.title}</div>
                <div style={{ fontSize:9, color: D.textMuted, marginTop:1, lineHeight:1.3 }}>{r.sub}</div>
              </div>
            </div>
          ))}
          <div style={{ marginTop:7, textAlign:'center' }}>
            <span style={{ fontSize:10, color:'#A78BFA', cursor:'pointer', fontWeight:600 }}>View All →</span>
          </div>
        </div>
      </div>

      {/* Row 3: Top Courses | Placement | Student Engagement */}
      <div style={{ display:'grid', gridTemplateColumns:'1.5fr 1fr 1fr', gap:8, padding:'0 14px', marginBottom:8 }}>

        {/* Top Performing Courses */}
        <div style={{ ...D.card, padding:'10px 12px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
            <div style={{ fontSize:11, fontWeight:700, color: D.text }}>Top Performing Courses</div>
            <span onClick={() => onNav('courses')} style={{ fontSize:10, color:'#A78BFA', cursor:'pointer', fontWeight:600 }}>View All →</span>
          </div>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:10 }}>
            <thead>
              <tr>{['Course Name','Enrolled','Completion','Trend'].map(h => (
                <th key={h} style={{ textAlign:'left', padding:'3px 5px', color: D.textDim, fontWeight:600, borderBottom:'1px solid #1E2D4A', fontSize:9 }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {(topCourses.length > 0 ? topCourses : [
                { title:'AI Engineer Program', enrolled:245, seats:280 },
                { title:'Full Stack Development', enrolled:198, seats:220 },
                { title:'Data Science Masterclass', enrolled:167, seats:200 },
                { title:'Cloud DevOps Engineer', enrolled:124, seats:150 },
                { title:'Cyber Security Expert', enrolled:98, seats:120 },
              ]).map((c, i) => {
                const comp = c.seats ? Math.round(((c.enrolled || 0) / c.seats) * 100) : Math.round(85 + Math.random() * 10);
                return (
                  <tr key={i}>
                    <td style={{ padding:'5px 5px', color: D.text, borderBottom:'1px solid #1A2640', maxWidth:140, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.title}</td>
                    <td style={{ padding:'5px 5px', color:'#A78BFA', fontWeight:700, borderBottom:'1px solid #1A2640' }}>{(c.enrolled || 0).toLocaleString('en-IN')}</td>
                    <td style={{ padding:'5px 5px', borderBottom:'1px solid #1A2640' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                        <div style={{ flex:1, height:3, background:'#1E2D4A', borderRadius:2 }}>
                          <div style={{ width:`${Math.min(100,comp)}%`, height:'100%', background:'#22C55E', borderRadius:2 }} />
                        </div>
                        <span style={{ color: D.textMuted, fontSize:9, width:26 }}>{Math.min(100,comp)}%</span>
                      </div>
                    </td>
                    <td style={{ padding:'5px 5px', borderBottom:'1px solid #1A2640' }}>
                      <svg width="40" height="14"><polyline points={[0,11,8,8,16,9,24,5,32,7,40,3].join(' ')} fill="none" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round"/></svg>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Placement Analytics */}
        <div style={{ ...D.card, padding:'10px 12px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
            <div style={{ fontSize:11, fontWeight:700, color: D.text }}>Placement Analytics</div>
            <span style={{ fontSize:10, color:'#A78BFA', cursor:'pointer', fontWeight:600 }}>Report →</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
            <div style={{ position:'relative', flexShrink:0 }}>
              <MiniDonut pct={placementRate || 91} color="#FB923C" size={64} stroke={8} />
              <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column' }}>
                <div style={{ fontSize:12, fontWeight:800, color:'#FB923C' }}>{placementRate || 91}%</div>
                <div style={{ fontSize:7, color: D.textMuted }}>Placed</div>
              </div>
            </div>
            <div style={{ flex:1 }}>
              {[['Total Placed', (placedCount || 2846).toLocaleString('en-IN')], ['Top Salary', '₹24.5 LPA'], ['Avg Salary', '₹6.8 LPA']].map(([l, v]) => (
                <div key={l} style={{ marginBottom:4 }}>
                  <div style={{ fontSize:9, color: D.textMuted }}>{l}</div>
                  <div style={{ fontSize:11, fontWeight:700, color: D.text }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ fontSize:9, color: D.textMuted, marginBottom:5, fontWeight:600 }}>Top Hiring Companies</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
            {['TCS','Infosys','Wipro','Microsoft'].map(c => (
              <div key={c} style={{ background:'#1E2D4A', border:'1px solid #2D3F5A', borderRadius:5, padding:'3px 7px', fontSize:9, color: D.text, fontWeight:600 }}>{c}</div>
            ))}
          </div>
        </div>

        {/* Student Engagement */}
        <div style={{ ...D.card, padding:'10px 12px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
            <div style={{ fontSize:11, fontWeight:700, color: D.text }}>Student Engagement</div>
            <span style={{ fontSize:9, color: D.textMuted, background:'#1E2D4A', padding:'2px 6px', borderRadius:20 }}>This Month</span>
          </div>
          <div style={{ textAlign:'center', marginBottom:4 }}>
            <GaugeArc score={avgAttendance || 88} size={96} />
            <div style={{ fontSize:22, fontWeight:800, color: avgAttendance >= 75 ? '#22C55E' : '#F59E0B', marginTop:-8 }}>{avgAttendance || 88}<span style={{ fontSize:11, fontWeight:400, color: D.textMuted }}>/100</span></div>
            <div style={{ fontSize:10, color: D.textMuted }}>Engagement Score</div>
            <div style={{ fontSize:10, color: D.green, marginTop:1 }}>↑ 6.2% vs Last Month</div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:5, marginTop:6 }}>
            {[
              ['Students', totalStudents || 8954],
              ['Assessments', batches.length * 2 || 42],
              ['Graduates', placedCount || 168],
            ].map(([l, v]) => (
              <div key={l} style={{ textAlign:'center', background:'#1E2D4A', borderRadius:6, padding:'5px 3px' }}>
                <div style={{ fontSize:12, fontWeight:800, color: D.text }}>{v.toLocaleString('en-IN')}</div>
                <div style={{ fontSize:8, color: D.textMuted, marginTop:1 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 4: Recent Enrollments | Upcoming Batches | AI Alerts */}
      <div style={{ display:'grid', gridTemplateColumns:'1.3fr 1.2fr 1fr', gap:8, padding:'0 14px' }}>

        {/* Recent Enrollments */}
        <div style={{ ...D.card, padding:'10px 12px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:7 }}>
            <div style={{ fontSize:11, fontWeight:700, color: D.text }}>Recent Enrolments</div>
            <span onClick={() => onNav('candidates')} style={{ fontSize:10, color:'#A78BFA', cursor:'pointer', fontWeight:600 }}>View All →</span>
          </div>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:10 }}>
            <thead>
              <tr>{['Student','Course','Enrolled On','Status'].map(h => (
                <th key={h} style={{ textAlign:'left', padding:'3px 5px', color: D.textDim, fontWeight:600, borderBottom:'1px solid #1E2D4A', fontSize:9 }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {(recentCandidates.length > 0 ? recentCandidates : [
                { name:'Rahul Sharma',  course_title:'AI Engineer Program',    enroll_date:'2025-06-13', status:'active' },
                { name:'Priya Verma',   course_title:'Data Science Masterclass',enroll_date:'2025-06-13', status:'active' },
                { name:'Arjun Mehta',   course_title:'Full Stack Development', enroll_date:'2025-06-12', status:'active' },
                { name:'Sneha Iyer',    course_title:'Cloud DevOps Engineer',  enroll_date:'2025-06-12', status:'active' },
                { name:'Karan Patel',   course_title:'Cyber Security Expert',  enroll_date:'2025-06-11', status:'active' },
              ]).map((c, i) => (
                <tr key={i}>
                  <td style={{ padding:'5px', borderBottom:'1px solid #1A2640' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                      <div style={{ width:20, height:20, borderRadius:'50%', background:'#2D3F5A', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:700, color: D.text, flexShrink:0 }}>
                        {(c.name||'?')[0]}
                      </div>
                      <span style={{ color: D.text, fontSize:10 }}>{c.name}</span>
                    </div>
                  </td>
                  <td style={{ padding:'5px', color: D.textMuted, borderBottom:'1px solid #1A2640', maxWidth:110, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.course_title || c.batch_name || '—'}</td>
                  <td style={{ padding:'5px', color: D.textDim, borderBottom:'1px solid #1A2640', whiteSpace:'nowrap' }}>{c.enroll_date ? new Date(c.enroll_date).toLocaleDateString('en-IN',{day:'2-digit',month:'short'}) : '—'}</td>
                  <td style={{ padding:'5px', borderBottom:'1px solid #1A2640' }}>
                    <span style={{ background: c.status === 'active' ? '#22C55E22':'#F59E0B22', color: c.status === 'active' ? '#22C55E':'#F59E0B', fontSize:9, fontWeight:700, padding:'2px 6px', borderRadius:20 }}>
                      {c.status === 'active' ? 'Active' : c.status || 'Enrolled'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Upcoming Batches */}
        <div style={{ ...D.card, padding:'10px 12px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:7 }}>
            <div style={{ fontSize:11, fontWeight:700, color: D.text }}>Upcoming Batches</div>
            <span onClick={() => onNav('batches')} style={{ fontSize:10, color:'#A78BFA', cursor:'pointer', fontWeight:600 }}>View All →</span>
          </div>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:10 }}>
            <thead>
              <tr>{['Batch','Start','Enrolled','Seats'].map(h => (
                <th key={h} style={{ textAlign:'left', padding:'3px 5px', color: D.textDim, fontWeight:600, borderBottom:'1px solid #1E2D4A', fontSize:9 }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {(upcomingBatches.length > 0 ? upcomingBatches : [
                { name:'AI Engineer Program',     batch_code:'AIEP-27', start_date:'2025-06-20', learner_count:28, capacity:40 },
                { name:'Data Science Masterclass',batch_code:'DSM-22',  start_date:'2025-06-22', learner_count:32, capacity:40 },
                { name:'Full Stack Development',  batch_code:'FSD-34',  start_date:'2025-06-25', learner_count:36, capacity:50 },
                { name:'Cloud DevOps Engineer',   batch_code:'CDE-19',  start_date:'2025-06-28', learner_count:22, capacity:35 },
              ]).map((b, i) => {
                const left = (b.capacity || 40) - (b.learner_count || 0);
                const leftPct = (b.capacity || 40) > 0 ? (left / (b.capacity || 40)) * 100 : 0;
                return (
                  <tr key={i}>
                    <td style={{ padding:'5px', borderBottom:'1px solid #1A2640' }}>
                      <div style={{ color: D.text, fontSize:10, fontWeight:600, maxWidth:110, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{b.name || b.batch_code}</div>
                      <div style={{ color: D.textDim, fontSize:8 }}>{b.batch_code}</div>
                    </td>
                    <td style={{ padding:'5px', color: D.textMuted, borderBottom:'1px solid #1A2640', whiteSpace:'nowrap' }}>
                      {b.start_date ? new Date(b.start_date).toLocaleDateString('en-IN',{day:'2-digit',month:'short'}) : '—'}
                    </td>
                    <td style={{ padding:'5px', color:'#A78BFA', fontWeight:700, borderBottom:'1px solid #1A2640' }}>{b.learner_count || 0}</td>
                    <td style={{ padding:'5px', borderBottom:'1px solid #1A2640' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                        <div style={{ width:28, height:4, background:'#1E2D4A', borderRadius:2 }}>
                          <div style={{ width:`${Math.min(100,leftPct)}%`, height:'100%', background: leftPct > 30 ? '#22C55E':'#EF4444', borderRadius:2 }} />
                        </div>
                        <span style={{ fontSize:9, color: left > 5 ? '#22C55E':'#EF4444', fontWeight:700 }}>{left}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* AI Alerts & Notifications */}
        <div style={{ ...D.card, padding:'10px 12px' }}>
          <div style={{ fontSize:11, fontWeight:700, color: D.text, marginBottom:8 }}>AI Alerts & Notifications</div>
          {aiAlerts.map((a, i) => (
            <div key={i} style={{ display:'flex', gap:7, padding:'7px 0', borderBottom:'1px solid #1E2D4A', alignItems:'flex-start' }}>
              <div style={{ fontSize:13, flexShrink:0, marginTop:1 }}>{a.icon}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:10, fontWeight:600, color: D.text, lineHeight:1.3 }}>{a.text}</div>
                <div style={{ fontSize:9, color: D.textMuted, marginTop:1 }}>{a.sub}</div>
              </div>
              <div style={{ fontSize:8, color: D.textDim, flexShrink:0, whiteSpace:'nowrap' }}>{a.time}</div>
            </div>
          ))}
          <div style={{ marginTop:8, textAlign:'center' }}>
            <span style={{ fontSize:10, color:'#A78BFA', cursor:'pointer', fontWeight:600 }}>View All Alerts →</span>
          </div>
        </div>
      </div>

      {/* Floating right AI toolbar */}
      <div style={{ position:'fixed', right:6, top:'50%', transform:'translateY(-50%)', display:'flex', flexDirection:'column', gap:6, zIndex:1000 }}>
        {[
          { icon:'🤖', label:'AI Chat', action:() => setAiChat(true) },
          { icon:'📚', label:'Course Generator', action:() => onNav('courses-add') },
          { icon:'✏️', label:'Content Optimizer', action:() => {} },
          { icon:'📊', label:'Market Insights', action:() => {} },
          { icon:'💰', label:'Price Optimizer', action:() => {} },
        ].map(b => (
          <div key={b.label} title={b.label} onClick={b.action}
            style={{ width:44, height:44, borderRadius:12, background:'#1E2D4A', border:'1px solid #2D3F5A', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, cursor:'pointer', boxShadow:'0 2px 8px rgba(0,0,0,0.4)' }}>
            {b.icon}
          </div>
        ))}
      </div>

      {/* AI Chat Widget */}
      {aiChat && (
        <div style={{ position:'fixed', bottom:24, right:56, width:300, background:'#111827', border:'1px solid #1E2D4A', borderRadius:16, boxShadow:'0 8px 32px rgba(0,0,0,0.6)', zIndex:200, display:'flex', flexDirection:'column', overflow:'hidden' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 14px', borderBottom:'1px solid #1E2D4A' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg,#6366F1,#A78BFA)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>🤖</div>
              <div>
                <div style={{ fontSize:12, fontWeight:700, color: D.text }}>AI Assistant</div>
                <div style={{ fontSize:10, color:'#22C55E' }}>● Online</div>
              </div>
            </div>
            <button onClick={() => setAiChat(false)} style={{ background:'none', border:'none', color: D.textMuted, fontSize:18, cursor:'pointer' }}>×</button>
          </div>
          <div style={{ flex:1, overflowY:'auto', padding:'12px', maxHeight:260, display:'flex', flexDirection:'column', gap:8 }}>
            {chatLog.map((m, i) => (
              <div key={i} style={{ display:'flex', justifyContent: m.role === 'user' ? 'flex-end':'flex-start' }}>
                <div style={{ maxWidth:'80%', background: m.role === 'user' ? '#6366F1':'#1E2D4A', borderRadius:10, padding:'8px 12px', fontSize:11, color: D.text, lineHeight:1.4 }}>{m.text}</div>
              </div>
            ))}
            {chatBusy && <div style={{ fontSize:11, color: D.textMuted, alignSelf:'flex-start' }}>Thinking…</div>}
          </div>
          <div style={{ padding:'10px 12px', borderTop:'1px solid #1E2D4A', display:'flex', gap:8, flexDirection:'column' }}>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {['Course Ideas','Demand Analysis','Marketing Tips','Placement Insights'].map(chip => (
                <button key={chip} onClick={() => setChatMsg(chip)} style={{ fontSize:10, padding:'3px 8px', background:'#1E2D4A', border:'1px solid #2D3F5A', borderRadius:20, color: D.text, cursor:'pointer' }}>{chip}</button>
              ))}
            </div>
            <div style={{ display:'flex', gap:6 }}>
              <input value={chatMsg} onChange={e => setChatMsg(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !chatBusy && sendChat()}
                placeholder="Ask me anything…" style={{ flex:1, padding:'7px 10px', background:'#1E2D4A', border:'1px solid #2D3F5A', borderRadius:8, fontSize:11, color: D.text, outline:'none' }} />
              <button onClick={sendChat} disabled={chatBusy} style={{ width:32, height:32, borderRadius:'50%', background:'#6366F1', border:'none', color:'#fff', fontSize:16, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>→</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Organisation Profile ──────────────────────────────────────────────────────
// Validators for org profile fields
const VALIDATORS = {
  gstin:  v => /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{1}Z[A-Z0-9]{1}$/.test(v.toUpperCase()) ? '' : 'Invalid GSTIN (e.g. 27AAPFU0939F1ZV)',
  pan:    v => /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(v.toUpperCase()) ? '' : 'Invalid PAN (e.g. ABCDE1234F)',
  tan:    v => /^[A-Z]{4}[0-9]{5}[A-Z]{1}$/.test(v.toUpperCase()) ? '' : 'Invalid TAN (e.g. PDES03028F)',
  mobile: v => /^[6-9]\d{9}$/.test(v) ? '' : 'Must be 10 digits starting with 6–9',
  email:  v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '' : 'Enter a valid email address',
};

function OrgProfile({ user, onUserUpdate }) {
  const vp = user?.vendor_profile || {};
  const s1 = vp.step1 || {};
  const s2 = vp.step2 || {};
  const s3 = vp.step3 || {};
  const s9 = vp.step9 || {};

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const openEdit = () => {
    setForm({
      email:  user?.email || '',
      mobile: (user?.phone || '').replace(/^\+91/, ''),
      gstin:  (s3.gstin || user?.gstin || '').toUpperCase(),
      pan:    (s3.pan   || user?.pan   || '').toUpperCase(),
      tan:    (s3.tan   || '').toUpperCase(),
    });
    setErrors({});
    setSaved(false);
    setEditing(true);
  };

  const fv = k => form[k] || '';
  const setErr = (k, v) => setErrors(p => ({ ...p, [k]: v }));
  const clearErr = k => setErrors(p => ({ ...p, [k]: '' }));

  const validate = () => {
    const errs = {};
    Object.entries(VALIDATORS).forEach(([k, fn]) => {
      const val = (fv(k) || '').trim();
      if (val) errs[k] = fn(val);
    });
    if (!fv('email').trim()) errs.email = 'Email is required';
    if (!fv('mobile').trim()) errs.mobile = 'Mobile is required';
    setErrors(errs);
    return Object.values(errs).every(e => !e);
  };

  const save = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const updatedVp = { ...vp, step3: { ...s3, gstin: fv('gstin').toUpperCase(), pan: fv('pan').toUpperCase(), tan: fv('tan').toUpperCase() } };
      await api.updateMe({ email: fv('email'), phone: fv('mobile'), gstin: fv('gstin').toUpperCase(), pan: fv('pan').toUpperCase(), tan: fv('tan').toUpperCase(), vendor_profile: updatedVp });
      if (onUserUpdate) await onUserUpdate();
      setSaved(true);
      setTimeout(() => { setEditing(false); setSaved(false); }, 800);
    } catch (e) {
      if (e.field === 'email') setErrors(p => ({ ...p, email: e.message }));
      else if (e.field === 'org_name') setErrors(p => ({ ...p, _global: e.message }));
      else setErrors(p => ({ ...p, _global: e.message || 'Save failed' }));
    } finally {
      setSaving(false);
    }
  };

  const Row = ({ label, value }) => (
    <div style={{ display:'flex', padding:'8px 0', borderBottom:'1px solid #F8FAFF' }}>
      <span style={{ width:200, fontSize:12, color:'#64748B', flexShrink:0 }}>{label}</span>
      <span style={{ fontSize:12, fontWeight:600, color: value ? '#1E293B':'#CBD5E1' }}>{value || '—'}</span>
    </div>
  );

  const UPPERCASE_KEYS = new Set(['gstin', 'pan', 'tan']);
  const Field = ({ label, fkey, placeholder, hint }) => (
    <div style={{ marginBottom:14 }}>
      <label style={{ fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:4 }}>{label}</label>
      <input
        style={{ ...S.input, ...(errors[fkey] ? { borderColor:'#DC2626', background:'#FEF2F2' } : {}) }}
        value={fv(fkey)}
        placeholder={placeholder}
        onChange={e => { const v = UPPERCASE_KEYS.has(fkey) ? e.target.value.toUpperCase() : e.target.value; setForm(p => ({ ...p, [fkey]: v })); clearErr(fkey); }}
        onBlur={() => { const v = (fv(fkey) || '').trim(); if (v) setErr(fkey, VALIDATORS[fkey]?.(v) || ''); }}
      />
      {errors[fkey] ? <div style={{ color:'#DC2626', fontSize:11, marginTop:3 }}>⚠ {errors[fkey]}</div>
        : hint ? <div style={{ color:'#94A3B8', fontSize:11, marginTop:3 }}>{hint}</div> : null}
    </div>
  );

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:3 }}>
        <div style={S.pageTitle}>Organisation Profile</div>
        <button style={S.btnPrimary} onClick={openEdit}>✏ Edit</button>
      </div>
      <div style={S.pageSub}>Organisation profile overview</div>

      <div style={S.card}>
        <div style={S.cardTitle}>Basic details</div>
        <Row label="Organisation name" value={user?.org_name} />
        <Row label="Organisation classification" value={s1.orgType || user?.gender} />
        <Row label="Date of incorporation" value={fmtDate(s1.dateIncorp || user?.dob)} />
        <Row label="CIN / Registration no." value={s1.cinReg || user?.registration_number} />
        <Row label="Website" value={s1.website} />
        <Row label="Head office address" value={s1.headAddr || user?.address_line1} />
        <Row label="State" value={s1.headState || user?.state_name} />
        <Row label="City" value={s1.headCity || user?.city} />
        <Row label="PIN code" value={s1.headPin || user?.pincode} />
      </div>

      <div style={S.card}>
        <div style={S.cardTitle}>SPOC & contact</div>
        <Row label="SPOC name" value={s2.spocName || user?.first_name} />
        <Row label="SPOC designation" value={s2.spocDesig} />
        <Row label="Email" value={user?.email} />
        <Row label="Mobile" value={user?.phone} />
        <Row label="Alt. contact name" value={s2.altName} />
        <Row label="Alt. mobile" value={s2.altMobile} />
        <Row label="Alt. email" value={s2.altEmail} />
      </div>

      <div style={S.card}>
        <div style={S.cardTitle}>Legal & tax</div>
        <Row label="PAN" value={s3.pan || user?.pan} />
        <Row label="GSTIN" value={s3.gstin || user?.gstin} />
        <Row label="TAN" value={s3.tan} />
        <Row label="MSME registration" value={s3.msme} />
        <Row label="Udyam no." value={s3.udyam} />
      </div>

      <div style={S.card}>
        <div style={S.cardTitle}>Bank details</div>
        <Row label="Account name" value={s9.bankAccName || user?.bank_account_name} />
        <Row label="Account number" value={s9.bankAccNum ? '****' + String(s9.bankAccNum).slice(-4) : user?.bank_account_number ? '****' + String(user.bank_account_number).slice(-4) : null} />
        <Row label="IFSC code" value={s9.bankIfsc || user?.bank_ifsc} />
      </div>

      {editing && (
        <Modal title="Edit Organisation Profile" onClose={() => setEditing(false)}>
          <div style={{ marginBottom:8, paddingBottom:10, borderBottom:'1px solid #E2E8F0', fontSize:12, fontWeight:700, color:'#7886A6', textTransform:'uppercase', letterSpacing:.5 }}>Contact</div>
          <Field label="Email *" fkey="email" placeholder="contact@org.com" />
          <Field label="Mobile Number *" fkey="mobile" placeholder="9876543210" hint="10 digits starting with 6–9" />

          <div style={{ marginTop:16, marginBottom:8, paddingBottom:10, borderBottom:'1px solid #E2E8F0', fontSize:12, fontWeight:700, color:'#7886A6', textTransform:'uppercase', letterSpacing:.5 }}>Legal & Tax</div>
          <Field label="GSTIN" fkey="gstin" placeholder="27AAPFU0939F1ZV" hint="15-character GST Identification Number" />
          <Field label="PAN" fkey="pan" placeholder="ABCDE1234F" hint="10-character Permanent Account Number" />
          <Field label="TAN" fkey="tan" placeholder="PDES03028F" hint="10-character Tax Deduction Account Number" />

          {errors._global && <div style={{ background:'#FEE2E2', border:'1px solid #FECACA', color:'#991B1B', borderRadius:6, padding:'8px 12px', fontSize:12, marginBottom:10 }}>⚠ {errors._global}</div>}
          {saved && <div style={{ ...S.alert('success'), marginBottom:10 }}>✓ Saved successfully</div>}

          <div style={S.btnRow}>
            <button style={S.btn} onClick={() => setEditing(false)}>Cancel</button>
            <button style={S.btnPrimary} onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Generic list+form panel ───────────────────────────────────────────────────
function useList(fetcher) {
  const [data, setData] = useState([]);
  const [busy, setBusy] = useState(true);
  const [err, setErr] = useState('');
  const load = useCallback(() => {
    setBusy(true);
    fetcher().then(d => { setData(d); setBusy(false); }).catch(e => { setErr(e.message); setBusy(false); });
  }, [fetcher]);
  useEffect(() => { load(); }, [load]);
  return { data, setData, busy, err, reload: load };
}

// ── Centres ───────────────────────────────────────────────────────────────────
function Centres({ activeSection, onNav }) {
  const { data: centres, busy, reload } = useList(api.vendorCentres);
  const [modal, setModal] = useState(null); // null | 'add' | centre obj
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState({});
  const [onboardingCentres, setOnboardingCentres] = useState([]);

  useEffect(() => {
    api.vendorOnboardingCentres().then(setOnboardingCentres).catch(() => {});
  }, []);

  const importFromOnboarding = (oc) => {
    setForm({
      name:           oc.name        || '',
      centre_code:    oc.code        || '',
      centre_type:    oc.type        || '',
      centre_status:  oc.status      || '',
      ownership:      oc.own         || '',
      year_started:   oc.yearStarted || '',
      address:        oc.addr        || '',
      state_name:     oc.state       || '',
      district:       oc.district    || '',
      city:           oc.city        || '',
      pincode:        oc.pin         || '',
      area_sqft:      oc.area        || '',
      seating_capacity: oc.cap       || '',
      classrooms:     oc.classrooms  || '',
      labs:           oc.labs        || '',
      internet:       oc.internet    || '',
      power_backup:   oc.power_backup|| '',
      geo:            oc.geo         || '',
      equipment:      Array.isArray(oc.infra) ? oc.infra.join(', ') : '',
      step6_idx:      oc._idx,
    });
    setModal('add'); setSaveErr({});
  };

  const openAdd = () => { setForm({}); setModal('add'); setSaveErr({}); };
  const openEdit = (c) => { setForm({ ...c }); setModal(c); setSaveErr({}); };
  const closeModal = () => { setModal(null); setSaveErr({}); };

  const save = async () => {
    setSaving(true); setSaveErr({});
    try {
      if (modal === 'add') await api.createVendorCentre(form);
      else await api.updateVendorCentre(modal.id, form);
      reload(); closeModal();
    } catch (e) {
      if (e.field) setSaveErr({ [e.field]: e.message });
      else setSaveErr({ _global: e.message });
    }
    setSaving(false);
  };

  const del = async (id) => {
    if (!confirm('Delete this centre?')) return;
    await api.deleteVendorCentre(id); reload();
  };

  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  if (activeSection === 'centres-add') {
    return (
      <div>
        <div style={S.pageTitle}>Add Training Centre</div>
        <div style={S.pageSub}>Training Centres → Add Centre</div>
        <CentreForm form={form} setForm={setForm} onSave={async () => { await api.createVendorCentre(form); reload(); onNav('centres'); }} onCancel={() => onNav('centres')} saving={saving} setSaving={setSaving} />
      </div>
    );
  }

  return (
    <div>
      <div style={S.pageTitle}>Training Centres</div>
      <div style={S.pageSub}>All registered training centres</div>
      <div style={S.tblWrap}>
        <div style={S.tblHdr}>
          <span style={{ fontWeight:700, fontSize:13, color:'#0B1E3D' }}>{centres.length} centres</span>
          <div style={{ marginLeft:'auto' }}>
            <button style={S.btnPrimary} onClick={openAdd}>+ Add Centre</button>
          </div>
        </div>
        {onboardingCentres.filter(oc => !oc._imported).length > 0 && (
          <div style={{ margin:'12px 0', padding:14, background:'#EFF6FF', borderRadius:8, border:'1px solid #BFDBFE' }}>
            <div style={{ fontWeight:600, fontSize:13, color:'#1E40AF', marginBottom:8 }}>Import from onboarding profile ({onboardingCentres.filter(oc=>!oc._imported).length} available)</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
              {onboardingCentres.filter(oc => !oc._imported).map((oc, i) => (
                <div key={i} style={{ background:'#fff', border:'1px solid #93C5FD', borderRadius:6, padding:'6px 12px', display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontSize:13 }}>{oc.name || `Centre ${oc._idx + 1}`}</span>
                  {oc.city && <span style={{ fontSize:11, color:'#64748B' }}>{oc.city}</span>}
                  <button style={{ ...S.btnSm, fontSize:11 }} onClick={() => importFromOnboarding(oc)}>Pre-fill</button>
                </div>
              ))}
            </div>
          </div>
        )}
        {busy ? <Empty icon="⏳" msg="Loading…" /> : centres.length === 0 ? <Empty icon="🏢" msg="No centres added yet" /> : (
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead><tr>
              {['Name','City, State','Seats','Labs','Internet','Status','Actions'].map(h => <th key={h} style={S.th}>{h}</th>)}
            </tr></thead>
            <tbody>
              {centres.map(c => (
                <tr key={c.id}>
                  <td style={S.td}><div style={{ fontWeight:600 }}>{c.name}{c.step6_idx != null && <span style={{ marginLeft:6, fontSize:10, background:'#DCFCE7', color:'#15803D', borderRadius:4, padding:'1px 5px', fontWeight:600 }}>🔗 Imported</span>}</div></td>
                  <td style={S.td}>{[c.city, c.state_name].filter(Boolean).join(', ') || '—'}</td>
                  <td style={S.td}>{c.seating_capacity || '—'}</td>
                  <td style={S.td}>{c.labs || '—'}</td>
                  <td style={S.td}>{c.internet || '—'}</td>
                  <td style={S.td}>{statusPill(c.status)}</td>
                  <td style={S.td}>
                    <div style={{ display:'flex', gap:6 }}>
                      <button style={S.btnSm} onClick={() => openEdit(c)}>Edit</button>
                      <button style={S.btnSmDanger} onClick={() => del(c.id)}>Del</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <Modal title={modal === 'add' ? 'Add Centre' : 'Edit Centre'} onClose={closeModal} wide>
          <CentreForm form={form} setForm={setForm} onSave={save} onCancel={closeModal} saving={saving} setSaving={setSaving} saveErr={saveErr} inline />
        </Modal>
      )}
    </div>
  );
}

function CentreForm({ form, setForm, onSave, onCancel, saving, setSaving, saveErr, inline }) {
  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));
  const fv = (k) => form[k] || '';
  const [errors, setErrors] = useState({});
  const [pinLookup, setPinLookup] = useState('');
  const setErr = (k, msg) => setErrors(e => ({ ...e, [k]: msg }));
  const clearErr = (k) => setErrors(e => ({ ...e, [k]: '' }));

  const lookupPin = async (pin) => {
    if (!/^\d{6}$/.test(pin)) return;
    setPinLookup('loading');
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
      const data = await res.json();
      if (data[0]?.Status === 'Success' && data[0].PostOffice?.length > 0) {
        const po = data[0].PostOffice[0];
        setForm(p => ({
          ...p,
          state_name: po.State || p.state_name,
          district:   po.District || p.district,
          city:       po.Division || po.Block || p.city,
        }));
        setPinLookup('ok');
      } else {
        setPinLookup('notfound');
      }
    } catch {
      setPinLookup('error');
    }
  };
  const save = async () => {
    if (!form.name) { setErr('name', 'Centre name is required'); return; }
    const nameErr = validateText(form.name, 'Centre name', { min: 3, max: 150 });
    if (nameErr) { setErr('name', nameErr); return; }
    if (form.seating_capacity) {
      const capErr = validatePosInt(form.seating_capacity, 'Seating capacity', 5000);
      if (capErr) { setErr('seating_capacity', capErr); return; }
    }
    setSaving(true);
    try { await onSave(); } catch (e) { alert(e.message); }
    setSaving(false);
  };
  const nameErr = (saveErr && saveErr.name) || errors.name || '';
  const globalErr = saveErr && saveErr._global;
  return (
    <div>
      {globalErr && <div style={{ background:'#FEE2E2', border:'1px solid #FECACA', color:'#991B1B', borderRadius:6, padding:'8px 12px', fontSize:12, marginBottom:12 }}>⚠ {globalErr}</div>}
      <div style={S.sectionTitle}>Centre details</div>
      <div style={{ ...S.fGrid(2), marginBottom:12 }}>
        <div style={{ ...S.fGroup, gridColumn:'1/-1' }}>
          <label style={S.label}>Centre name *</label>
          <input style={{ ...S.input, ...(nameErr ? { borderColor:'#C0392B', background:'#FEF2F2' } : {}) }} value={fv('name')} onChange={e => { f('name')(e); clearErr('name'); }} placeholder="e.g. TechSkills Delhi North" />
          {nameErr && <div style={{ color:'#C0392B', fontSize:11, marginTop:3, fontWeight:500 }}>⚠ {nameErr}</div>}
        </div>
        <div style={S.fGroup}>
          <label style={S.label}>Centre code</label>
          <input style={{ ...S.input, textTransform:'uppercase' }} value={fv('centre_code')} onChange={f('centre_code')} placeholder="e.g. DLH" maxLength={3} />
          <span style={{ fontSize:11, color:'#64748B', marginTop:2 }}>3-char unique code (A–Z, 0–9)</span>
        </div>
        <div style={S.fGroup}>
          <label style={S.label}>Centre type</label>
          <select style={S.select} value={fv('centre_type')} onChange={f('centre_type')}>
            <option value="">Select</option>
            {['Permanent Centre','Franchise Centre','Rented Centre','Government Centre','Mobile Training Centre','Residential Centre','Corporate Training Centre','Assessment Centre'].map(o => <option key={o}>{o}</option>)}
          </select>
        </div>
        <div style={S.fGroup}>
          <label style={S.label}>Centre status</label>
          <select style={S.select} value={fv('centre_status')} onChange={f('centre_status')}>
            <option value="">Select</option>
            {['Active','Inactive','Under Construction','Temporarily Closed','Permanently Closed'].map(o => <option key={o}>{o}</option>)}
          </select>
        </div>
        <div style={S.fGroup}>
          <label style={S.label}>Ownership</label>
          <select style={S.select} value={fv('ownership')} onChange={f('ownership')}>
            <option value="">Select</option>
            {['Owned','Rented / Leased','Government Allotted'].map(o => <option key={o}>{o}</option>)}
          </select>
        </div>
        <div style={S.fGroup}>
          <label style={S.label}>Year started</label>
          <input style={S.input} type="number" value={fv('year_started')} onChange={f('year_started')} placeholder="e.g. 2018" min={1900} max={new Date().getFullYear()} />
        </div>
        <div style={{ ...S.fGroup, gridColumn:'1/-1' }}><label style={S.label}>Full address</label><input style={S.input} value={fv('address')} onChange={f('address')} placeholder="Building, street, locality" /></div>
        <div style={S.fGroup}><label style={S.label}>State</label>
          <select style={S.select} value={fv('state_name')} onChange={f('state_name')}>
            <option value="">Select state</option>
            {INDIAN_STATES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div style={S.fGroup}><label style={S.label}>District</label><input style={S.input} value={fv('district')} onChange={f('district')} /></div>
        <div style={S.fGroup}><label style={S.label}>City</label><input style={S.input} value={fv('city')} onChange={f('city')} /></div>
        <div style={S.fGroup}>
          <label style={S.label}>PIN code</label>
          <div style={{ position:'relative' }}>
            <input
              style={{ ...S.input, ...(errors.pincode ? { borderColor:'#C0392B', background:'#FEF2F2' } : {}), paddingRight:28 }}
              value={fv('pincode')}
              maxLength={6}
              placeholder="6-digit PIN"
              onChange={e => {
                const v = e.target.value.replace(/\D/g, '').slice(0, 6);
                setForm(p => ({ ...p, pincode: v }));
                clearErr('pincode');
                setPinLookup('');
                if (v.length === 6) lookupPin(v);
              }}
            />
            <span style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', fontSize:13 }}>
              {pinLookup === 'loading' && '⏳'}
              {pinLookup === 'ok'      && '✅'}
              {pinLookup === 'notfound'&& '❌'}
              {pinLookup === 'error'   && '⚠️'}
            </span>
          </div>
          {errors.pincode   && <div style={{ color:'#C0392B', fontSize:11, marginTop:3, fontWeight:500 }}>⚠ {errors.pincode}</div>}
          {pinLookup === 'notfound' && <div style={{ color:'#B45309', fontSize:11, marginTop:3 }}>PIN code not found — please fill fields manually.</div>}
          {pinLookup === 'error'    && <div style={{ color:'#B45309', fontSize:11, marginTop:3 }}>Lookup failed — please fill fields manually.</div>}
          {pinLookup === 'ok'       && <div style={{ color:'#15803D', fontSize:11, marginTop:3 }}>State, district &amp; city auto-filled.</div>}
        </div>
        <div style={S.fGroup}><label style={S.label}>Geo-location (lat, long or Maps link)</label><input style={S.input} value={fv('geo')} onChange={f('geo')} placeholder="19.1136, 72.8697" /></div>
        <div style={S.fGroup}>
          <label style={S.label}>Area (sq ft)</label>
          <input style={S.input} type="number" value={fv('area_sqft')} onChange={f('area_sqft')} placeholder="e.g. 3000" />
        </div>
        <div style={S.fGroup}>
          <label style={S.label}>Seating capacity</label>
          <input style={{ ...S.input, ...(errors.seating_capacity ? { borderColor:'#C0392B', background:'#FEF2F2' } : {}) }} type="number" value={fv('seating_capacity')} onChange={e => { f('seating_capacity')(e); clearErr('seating_capacity'); }} />
          {errors.seating_capacity && <div style={{ color:'#C0392B', fontSize:11, marginTop:3, fontWeight:500 }}>⚠ {errors.seating_capacity}</div>}
        </div>
        <div style={S.fGroup}><label style={S.label}>Classrooms</label><input style={S.input} type="number" value={fv('classrooms')} onChange={f('classrooms')} /></div>
        <div style={S.fGroup}><label style={S.label}>Labs</label><input style={S.input} type="number" value={fv('labs')} onChange={f('labs')} /></div>
        <div style={S.fGroup}><label style={S.label}>Internet connectivity</label>
          <select style={S.select} value={fv('internet')} onChange={f('internet')}>
            <option value="">Select</option>
            {['Broadband','Leased line','Mobile data / 4G','None'].map(o => <option key={o}>{o}</option>)}
          </select>
        </div>
        <div style={S.fGroup}><label style={S.label}>Power backup</label>
          <select style={S.select} value={fv('power_backup')} onChange={f('power_backup')}>
            <option value="">Select</option>
            {['Generator','UPS','Solar','None'].map(o => <option key={o}>{o}</option>)}
          </select>
        </div>
        <div style={S.fGroup}><label style={S.label}>Accessibility (differently abled)</label>
          <select style={S.select} value={fv('accessibility')} onChange={f('accessibility')}>
            <option value="">Select</option>
            {['Yes — ramp & elevator','Partial','No'].map(o => <option key={o}>{o}</option>)}
          </select>
        </div>
        <div style={{ ...S.fGroup, gridColumn:'1/-1' }}>
          <label style={S.label}>Equipment &amp; Facilities</label>
          <div style={{ border:'1px solid #CBD5E1', borderRadius:6, padding:'10px 12px', background:'#fff' }}>
            {EQUIPMENT_OPTIONS.map(grp => {
              const selected = (fv('equipment') || '').split(',').map(s => s.trim()).filter(Boolean);
              const toggle = (item) => {
                const next = selected.includes(item) ? selected.filter(x => x !== item) : [...selected, item];
                setForm(p => ({ ...p, equipment: next.join(', ') }));
              };
              return (
                <div key={grp.group} style={{ marginBottom:8 }}>
                  <div style={{ fontSize:11, fontWeight:600, color:'#64748B', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:4 }}>{grp.group}</div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:'6px 12px' }}>
                    {grp.items.map(item => {
                      const checked = (fv('equipment') || '').split(',').map(s => s.trim()).includes(item);
                      return (
                        <label key={item} style={{ display:'flex', alignItems:'center', gap:5, fontSize:13, cursor:'pointer', userSelect:'none' }}>
                          <input type="checkbox" checked={checked} onChange={() => toggle(item)} style={{ accentColor:'#0A2D6E', width:14, height:14 }} />
                          {item}
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div style={S.btnRow}>
        <button style={S.btn} onClick={onCancel}>Cancel</button>
        <button style={S.btnPrimary} onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Centre'}</button>
      </div>
    </div>
  );
}

// ── Trainers ──────────────────────────────────────────────────────────────────
function TrainersList({ activeSection, onNav }) {
  const { data: trainers, busy, reload } = useList(api.vendorTrainers);
  const { data: centres } = useList(api.vendorCentres);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [linkStatus, setLinkStatus] = useState(''); // '' | 'searching' | 'linked' | 'notfound'
  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));
  const fv = (k) => form[k] || '';
  const setErr = (k, msg) => setErrors(e => ({ ...e, [k]: msg }));
  const clearErr = (k) => setErrors(e => ({ ...e, [k]: '' }));

  const openModal = (val) => {
    setModal(val); setErrors({});
    setLinkStatus(val === 'add' ? '' : (val.user_id ? 'linked' : ''));
  };

  const lookupTrainer = async (email) => {
    if (!email || !/\S+@\S+\.\S+/.test(email)) return;
    setLinkStatus('searching');
    try {
      const u = await api.lookupTrainerByEmail(email);
      setForm(p => ({
        ...p,
        user_id:       u.id,
        name:          p.name || u.name || '',
        mobile:        p.mobile || (u.phone || '').replace(/^\+91/, '') || '',
        dob:           p.dob   || u.dob   || '',
        gender:        p.gender    || u.gender    || '',
        category:      p.category  || u.category  || '',
        pan:           p.pan   || u.pan   || '',
        qualification: p.qualification || u.qualification || '',
        sector:        p.sector || u.preferred_sector || '',
      }));
      setLinkStatus('linked');
    } catch {
      setLinkStatus('notfound');
    }
  };

  const save = async () => {
    if (!form.name) { setErr('name', 'Trainer name required'); return; }
    const nameErr = fieldValidate('name', form.name);
    if (nameErr) { setErr('name', nameErr); return; }
    if (form.experience_years) { const expErr = validatePositiveNum(form.experience_years, 'Experience years', 0, 60); if (expErr) { alert(expErr); return; } }
    setSaving(true);
    try {
      if (modal === 'add') await api.createVendorTrainer(form);
      else await api.updateVendorTrainer(modal.id, form);
      reload(); setModal(null); setErrors({});
    } catch (e) {
      if (e.field) setErr(e.field, e.message);
      else setErr('_global', e.message);
    }
    setSaving(false);
  };

  const del = async (id) => { if (!confirm('Remove trainer?')) return; await api.deleteVendorTrainer(id); reload(); };

  return (
    <div>
      <div style={S.pageTitle}>Trainers & Faculty</div>
      <div style={S.pageSub}>Registered trainers across all centres</div>
      <div style={S.tblWrap}>
        <div style={S.tblHdr}>
          <span style={{ fontWeight:700, fontSize:13, color:'#0B1E3D' }}>{trainers.length} trainers</span>
          <div style={{ marginLeft:'auto' }}>
            <button style={S.btnPrimary} onClick={() => { setForm({}); openModal('add'); }}>+ Add Trainer</button>
          </div>
        </div>
        {busy ? <Empty icon="⏳" msg="Loading…" /> : trainers.length === 0 ? <Empty icon="👨‍🏫" msg="No trainers added yet" /> : (
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead><tr>
              {['Name','Qualification','Sector','Exp.','NSQF','Centre','Status','Actions'].map(h => <th key={h} style={S.th}>{h}</th>)}
            </tr></thead>
            <tbody>
              {trainers.map(t => (
                <tr key={t.id}>
                  <td style={S.td}>
                    <div style={{ fontWeight:600 }}>{t.name}{t.user_id && <span style={{ marginLeft:6, fontSize:10, background:'#DCFCE7', color:'#15803D', borderRadius:4, padding:'1px 5px', fontWeight:600 }}>🔗 Linked</span>}</div>
                    <div style={{ fontSize:11, color:'#64748B' }}>{t.email}</div>
                  </td>
                  <td style={S.td}>{t.qualification || '—'}</td>
                  <td style={S.td}>{t.sector || '—'}</td>
                  <td style={S.td}>{t.experience_years ? `${t.experience_years} yrs` : '—'}</td>
                  <td style={S.td}>{t.nsqf_level ? <Pill col="blue">{t.nsqf_level}</Pill> : '—'}</td>
                  <td style={S.td}>{t.centre_name || '—'}</td>
                  <td style={S.td}>{statusPill(t.status)}</td>
                  <td style={S.td}>
                    <div style={{ display:'flex', gap:6 }}>
                      <button style={S.btnSm} onClick={() => { setForm({ ...t }); openModal(t); }}>Edit</button>
                      <button style={S.btnSmDanger} onClick={() => del(t.id)}>Del</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <Modal title={modal === 'add' ? 'Add Trainer' : 'Edit Trainer'} onClose={() => { setModal(null); setErrors({}); setLinkStatus(''); }}>
          <div style={S.fGrid(2)}>
            {errors._global && <div style={{ gridColumn:'1/-1', background:'#FEE2E2', border:'1px solid #FECACA', color:'#991B1B', borderRadius:6, padding:'8px 12px', fontSize:12 }}>⚠ {errors._global}</div>}
            <div style={{ ...S.fGroup, gridColumn:'1/-1' }}>
              <label style={S.label}>Full name *</label>
              <input style={{ ...S.input, ...(errors.name ? { borderColor:'#C0392B', background:'#FEF2F2' } : {}) }} value={fv('name')} onChange={e => { f('name')(e); clearErr('name'); }} />
              {errors.name && <div style={{ color:'#C0392B', fontSize:11, marginTop:3, fontWeight:500 }}>⚠ {errors.name}</div>}
            </div>
            <div style={S.fGroup}>
              <label style={S.label}>
                Email
                {linkStatus === 'searching' && <span style={{ marginLeft:6, fontSize:11, color:'#64748B' }}>🔍 Looking up…</span>}
                {linkStatus === 'linked'    && <span style={{ marginLeft:6, fontSize:11, color:'#15803D', fontWeight:600 }}>🔗 Linked to trainer account</span>}
                {linkStatus === 'notfound'  && <span style={{ marginLeft:6, fontSize:11, color:'#B45309' }}>No trainer account found — fields filled manually</span>}
              </label>
              <input style={{ ...S.input, ...(errors.email ? { borderColor:'#C0392B', background:'#FEF2F2' } : {}), ...(linkStatus === 'linked' ? { borderColor:'#16A34A', background:'#F0FDF4' } : {}) }}
                type="email" value={fv('email')}
                onChange={e => { f('email')(e); clearErr('email'); setLinkStatus(''); setForm(p => ({ ...p, user_id: undefined })); }}
                onBlur={() => {
                  const v = fv('email');
                  if (v) { setErr('email', fieldValidate('email', v)); if (!errors.email) lookupTrainer(v); }
                }} />
              {errors.email && <div style={{ color:'#C0392B', fontSize:11, marginTop:3, fontWeight:500 }}>⚠ {errors.email}</div>}
            </div>
            <div style={S.fGroup}><label style={S.label}>Mobile</label>
              <input style={{ ...S.input, ...(errors.mobile ? { borderColor:'#C0392B', background:'#FEF2F2' } : {}) }}
                value={fv('mobile')}
                onChange={e => { f('mobile')(e); clearErr('mobile'); }}
                onBlur={() => { const v = fv('mobile'); if (v) setErr('mobile', /^[6-9]\d{9}$/.test(v) ? '' : 'Must be a 10-digit number starting with 6–9'); }} />
              {errors.mobile && <div style={{ color:'#C0392B', fontSize:11, marginTop:3, fontWeight:500 }}>⚠ {errors.mobile}</div>}
            </div>
            <div style={S.fGroup}><label style={S.label}>Date of birth</label><input style={S.input} type="date" value={fv('dob')} onChange={f('dob')} /></div>
            <div style={S.fGroup}><label style={S.label}>Gender</label>
              <select style={S.select} value={fv('gender')} onChange={f('gender')}>
                <option value="">Select</option>
                {['Male','Female','Other'].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div style={S.fGroup}><label style={S.label}>Category</label>
              <select style={S.select} value={fv('category')} onChange={f('category')}>
                <option value="">Select</option>
                {['General','OBC','SC','ST','EWS'].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div style={S.fGroup}><label style={S.label}>Aadhaar number</label>
              <input style={{ ...S.input, ...(errors.aadhaar ? { borderColor:'#C0392B', background:'#FEF2F2' } : {}) }}
                value={fv('aadhaar')} maxLength={12} placeholder="12-digit Aadhaar"
                onChange={e => { f('aadhaar')(e); clearErr('aadhaar'); }}
                onBlur={() => { const v = fv('aadhaar'); if (v) setErr('aadhaar', /^\d{12}$/.test(v) ? '' : 'Must be a 12-digit number'); }} />
              {errors.aadhaar && <div style={{ color:'#C0392B', fontSize:11, marginTop:3, fontWeight:500 }}>⚠ {errors.aadhaar}</div>}
            </div>
            <div style={S.fGroup}><label style={S.label}>PAN number</label>
              <input style={{ ...S.input, textTransform:'uppercase', ...(errors.pan ? { borderColor:'#C0392B', background:'#FEF2F2' } : {}) }}
                value={fv('pan')} maxLength={10} placeholder="e.g. ABCDE1234F"
                onChange={e => { setForm(p => ({ ...p, pan: e.target.value.toUpperCase() })); clearErr('pan'); }}
                onBlur={() => { const v = fv('pan'); if (v) setErr('pan', /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(v) ? '' : 'Invalid PAN format'); }} />
              {errors.pan && <div style={{ color:'#C0392B', fontSize:11, marginTop:3, fontWeight:500 }}>⚠ {errors.pan}</div>}
            </div>
            <div style={S.fGroup}><label style={S.label}>Qualification</label><input style={S.input} value={fv('qualification')} onChange={f('qualification')} placeholder="B.Tech, MBA…" /></div>
            <div style={S.fGroup}><label style={S.label}>Sector</label>
              <select style={S.select} value={fv('sector')} onChange={f('sector')}>
                <option value="">Select sector</option>
                {SECTORS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div style={S.fGroup}><label style={S.label}>Experience (years)</label><input style={S.input} type="number" value={fv('experience_years')} onChange={f('experience_years')} /></div>
            <div style={S.fGroup}><label style={S.label}>NSQF level</label>
              <select style={S.select} value={fv('nsqf_level')} onChange={f('nsqf_level')}>
                <option value="">Select</option>
                {NSQF.map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
            <div style={S.fGroup}><label style={S.label}>Assigned centre</label>
              <select style={S.select} value={fv('centre_id')} onChange={f('centre_id')}>
                <option value="">Select centre</option>
                {centres.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div style={S.btnRow}>
            <button style={S.btn} onClick={() => setModal(null)}>Cancel</button>
            <button style={S.btnPrimary} onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Courses ───────────────────────────────────────────────────────────────────
function CoursesList() {
  const { data: courses, busy, reload } = useList(api.vendorCourses);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));
  const fv = (k) => form[k] || '';
  const setErr = (k, msg) => setErrors(e => ({ ...e, [k]: msg }));
  const clearErr = (k) => setErrors(e => ({ ...e, [k]: '' }));

  const save = async () => {
    if (!form.title) { setErr('title', 'Course title required'); return; }
    const titleErr = validateText(form.title, 'Course title', { min: 3, max: 200 });
    if (titleErr) { setErr('title', titleErr); return; }
    setSaving(true);
    try {
      if (modal === 'add') await api.createVendorCourse(form);
      else await api.updateVendorCourse(modal.id, form);
      reload(); setModal(null); setErrors({});
    } catch (e) {
      if (e.field) setErr(e.field, e.message);
      else setErr('_global', e.message);
    }
    setSaving(false);
  };

  const del = async (id) => { if (!confirm('Delete this course?')) return; await api.deleteVendorCourse(id); reload(); };

  return (
    <div>
      <div style={S.pageTitle}>Courses & Curriculum</div>
      <div style={S.pageSub}>Course catalogue with QP/NOS mapping</div>
      <div style={S.tblWrap}>
        <div style={S.tblHdr}>
          <span style={{ fontWeight:700, fontSize:13, color:'#0B1E3D' }}>{courses.length} courses</span>
          <div style={{ marginLeft:'auto' }}>
            <button style={S.btnPrimary} onClick={() => { setForm({}); setModal('add'); }}>+ Add Course</button>
          </div>
        </div>
        {busy ? <Empty icon="⏳" msg="Loading…" /> : courses.length === 0 ? <Empty icon="📚" msg="No courses added yet" /> : (
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead><tr>
              {['Course title','Sector','QP code','NOS code','NSQF','Hours','Fee type','Scheme','Actions'].map(h => <th key={h} style={S.th}>{h}</th>)}
            </tr></thead>
            <tbody>
              {courses.map(c => (
                <tr key={c.id}>
                  <td style={S.td}><div style={{ fontWeight:600 }}>{c.title}</div></td>
                  <td style={S.td}>{c.sector || '—'}</td>
                  <td style={S.td}>{c.qp_code || '—'}</td>
                  <td style={S.td}>{c.nos_code || '—'}</td>
                  <td style={S.td}>{c.nsqf_level ? <Pill col="blue">{c.nsqf_level}</Pill> : '—'}</td>
                  <td style={S.td}>{c.duration_hours ? `${c.duration_hours}h` : '—'}</td>
                  <td style={S.td}>{c.fee_type || '—'}</td>
                  <td style={S.td}>{c.scheme || '—'}</td>
                  <td style={S.td}>
                    <div style={{ display:'flex', gap:6 }}>
                      <button style={S.btnSm} onClick={() => { setForm({ ...c }); setModal(c); }}>Edit</button>
                      <button style={S.btnSmDanger} onClick={() => del(c.id)}>Del</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <Modal title={modal === 'add' ? 'Add Course' : 'Edit Course'} onClose={() => { setModal(null); setErrors({}); }} wide>
          <div style={S.fGrid(2)}>
            {errors._global && <div style={{ gridColumn:'1/-1', background:'#FEE2E2', border:'1px solid #FECACA', color:'#991B1B', borderRadius:6, padding:'8px 12px', fontSize:12 }}>⚠ {errors._global}</div>}
            <div style={{ ...S.fGroup, gridColumn:'1/-1' }}>
              <label style={S.label}>Course title *</label>
              <input style={{ ...S.input, ...(errors.title ? { borderColor:'#EF4444' } : {}) }} value={fv('title')} onChange={e => { f('title')(e); clearErr('title'); }} />
              {errors.title && <span style={{ color:'#EF4444', fontSize:11, marginTop:3 }}>{errors.title}</span>}
            </div>
            <div style={S.fGroup}><label style={S.label}>Sector</label>
              <select style={S.select} value={fv('sector')} onChange={f('sector')}>
                <option value="">Select</option>
                {SECTORS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div style={S.fGroup}><label style={S.label}>Qualification Pack (QP) code</label><input style={S.input} value={fv('qp_code')} onChange={f('qp_code')} placeholder="e.g. RSC/Q0101" /></div>
            <div style={S.fGroup}><label style={S.label}>NOS codes</label><input style={S.input} value={fv('nos_code')} onChange={f('nos_code')} placeholder="e.g. RSC/N0101, RSC/N0102" /></div>
            <div style={S.fGroup}><label style={S.label}>NSQF level</label>
              <select style={S.select} value={fv('nsqf_level')} onChange={f('nsqf_level')}>
                <option value="">Select</option>
                {NSQF.map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
            <div style={S.fGroup}><label style={S.label}>Duration (hours)</label><input style={S.input} type="number" value={fv('duration_hours')} onChange={f('duration_hours')} /></div>
            <div style={S.fGroup}><label style={S.label}>Fee type</label>
              <select style={S.select} value={fv('fee_type')} onChange={f('fee_type')}>
                <option value="">Select</option>
                {['Fee-based','PMKVY 4.0','DDU-GKY','CSR','State Mission','Apprenticeship','Free'].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div style={S.fGroup}><label style={S.label}>Fee amount (₹)</label><input style={S.input} type="number" value={fv('fee_amount')} onChange={f('fee_amount')} /></div>
            <div style={S.fGroup}><label style={S.label}>Scheme</label>
              <select style={S.select} value={fv('scheme')} onChange={f('scheme')}>
                <option value="">Select</option>
                {SCHEMES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div style={S.btnRow}>
            <button style={S.btn} onClick={() => setModal(null)}>Cancel</button>
            <button style={S.btnPrimary} onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Batches ───────────────────────────────────────────────────────────────────
const BATCH_STATUSES = ['upcoming','ongoing','completed','cancelled'];

function Batches() {
  const { data: batches, busy, reload } = useList(api.vendorBatches);
  const { data: centres } = useList(api.vendorCentres);
  const { data: courses } = useList(api.vendorCourses);
  const { data: trainers } = useList(api.vendorTrainers);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('all');
  const [errors, setErrors] = useState({});
  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));
  const fv = (k) => form[k] || '';
  const setErr = (k, msg) => setErrors(e => ({ ...e, [k]: msg }));
  const clearErr = (k) => setErrors(e => ({ ...e, [k]: '' }));

  const save = async () => {
    if (!form.course_id) { setErr('course_id', 'Please select a course.'); return; }
    if (form.batch_code && !/^[A-Za-z0-9][A-Za-z0-9\-_]{1,19}$/.test(form.batch_code.trim())) {
      setErr('batch_code', 'Batch code must be 2–20 characters (letters, digits, dash or underscore).'); return;
    }
    const capErr = validatePosInt(form.capacity, 'Capacity', 1000);
    if (capErr) { setErr('capacity', capErr); return; }
    setSaving(true);
    try {
      if (modal === 'add') await api.createVendorBatch(form);
      else await api.updateVendorBatch(modal.id, form);
      reload(); setModal(null); setErrors({});
    } catch (e) {
      if (e.field) setErr(e.field, e.message);
      else setErr('_global', e.message);
    }
    setSaving(false);
  };

  const del = async (id) => { if (!confirm('Cancel/delete this batch?')) return; await api.deleteVendorBatch(id); reload(); };
  const filtered = filter === 'all' ? batches : batches.filter(b => b.status === filter);

  return (
    <div>
      <div style={S.pageTitle}>Batch Management</div>
      <div style={S.pageSub}>All training batches</div>

      <div style={{ display:'flex', gap:8, marginBottom:12 }}>
        {['all', ...BATCH_STATUSES].map(s => (
          <button key={s} style={{ ...S.btn, background: filter===s ? '#0A2D6E':'#fff', color: filter===s ? '#fff':'#334155', textTransform:'capitalize' }} onClick={() => setFilter(s)}>{s}</button>
        ))}
        <button style={{ ...S.btnPrimary, marginLeft:'auto' }} onClick={() => { setForm({}); setModal('add'); }}>+ Create Batch</button>
      </div>

      <div style={S.tblWrap}>
        {busy ? <Empty icon="⏳" msg="Loading…" /> : filtered.length === 0 ? <Empty icon="📅" msg="No batches yet" /> : (
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead><tr>
              {['Batch code','Course','Centre','Trainer','Start date','End date','Capacity','Status','Actions'].map(h => <th key={h} style={S.th}>{h}</th>)}
            </tr></thead>
            <tbody>
              {filtered.map(b => (
                <tr key={b.id}>
                  <td style={S.td}><div style={{ fontWeight:700, color:'#0A2D6E' }}>{b.batch_code}</div></td>
                  <td style={S.td}>{b.course_title || '—'}</td>
                  <td style={S.td}>{b.centre_name || '—'}</td>
                  <td style={S.td}>{b.trainer_name || '—'}</td>
                  <td style={S.td}>{fmtDate(b.start_date)}</td>
                  <td style={S.td}>{fmtDate(b.end_date)}</td>
                  <td style={S.td}>{b.enrolled}/{b.capacity}</td>
                  <td style={S.td}>{statusPill(b.status)}</td>
                  <td style={S.td}>
                    <div style={{ display:'flex', gap:6 }}>
                      <button style={S.btnSm} onClick={() => { setForm({ ...b }); setModal(b); }}>Edit</button>
                      <button style={S.btnSmDanger} onClick={() => del(b.id)}>Del</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <Modal title={modal === 'add' ? 'Create Batch' : 'Edit Batch'} onClose={() => { setModal(null); setErrors({}); }} wide>
          <div style={S.fGrid(2)}>
            {errors._global && <div style={{ gridColumn:'1/-1', background:'#FEE2E2', border:'1px solid #FECACA', color:'#991B1B', borderRadius:6, padding:'8px 12px', fontSize:12 }}>⚠ {errors._global}</div>}
            <div style={S.fGroup}>
              <label style={S.label}>Batch code</label>
              <input style={{ ...S.input, ...(errors.batch_code ? { borderColor:'#EF4444' } : {}) }} value={fv('batch_code')} onChange={e => { f('batch_code')(e); clearErr('batch_code'); }} placeholder="Auto-generated if blank" />
              {errors.batch_code && <span style={{ color:'#EF4444', fontSize:11, marginTop:3 }}>{errors.batch_code}</span>}
            </div>
            <div style={S.fGroup}><label style={S.label}>Status</label>
              <select style={S.select} value={fv('status')} onChange={f('status')}>
                {BATCH_STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div style={S.fGroup}>
              <label style={S.label}>Course *</label>
              <select style={{ ...S.select, ...(errors.course_id ? { borderColor:'#EF4444' } : {}) }} value={fv('course_id')} onChange={e => { f('course_id')(e); clearErr('course_id'); }}>
                <option value="">Select course</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
              {errors.course_id && <span style={{ color:'#EF4444', fontSize:11, marginTop:3 }}>{errors.course_id}</span>}
            </div>
            <div style={S.fGroup}><label style={S.label}>Training centre</label>
              <select style={S.select} value={fv('centre_id')} onChange={f('centre_id')}>
                <option value="">Select centre</option>
                {centres.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div style={S.fGroup}><label style={S.label}>Trainer</label>
              <select style={S.select} value={fv('trainer_id')} onChange={f('trainer_id')}>
                <option value="">Select trainer</option>
                {trainers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div style={S.fGroup}><label style={S.label}>Capacity</label><input style={S.input} type="number" value={fv('capacity')} onChange={f('capacity')} placeholder="30" /></div>
            <div style={S.fGroup}><label style={S.label}>Start date</label><input style={S.input} type="date" value={fv('start_date')} onChange={f('start_date')} /></div>
            <div style={S.fGroup}><label style={S.label}>End date</label><input style={S.input} type="date" value={fv('end_date')} onChange={f('end_date')} /></div>
          </div>
          <div style={S.btnRow}>
            <button style={S.btn} onClick={() => setModal(null)}>Cancel</button>
            <button style={S.btnPrimary} onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Candidates ────────────────────────────────────────────────────────────────
const CAND_STATUSES = ['enrolled','completed','dropout','withdrawn'];
const GENDERS = ['Male','Female','Transgender','Prefer not to say'];
const CATEGORIES = ['General','SC','ST','OBC','EWS','Minority','PwD'];

function Candidates() {
  const { data: candidates, busy, reload } = useList(api.vendorCandidates);
  const { data: batches } = useList(api.vendorBatches);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [batchFilter, setBatchFilter] = useState('');
  const [errors, setErrors] = useState({});
  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));
  const fv = (k) => form[k] || '';
  const setErr = (k, msg) => setErrors(e => ({ ...e, [k]: msg }));
  const clearErr = (k) => setErrors(e => ({ ...e, [k]: '' }));

  const save = async () => {
    if (!form.name) { alert('Candidate name required'); return; }
    const nameErr = fieldValidate('name', form.name);
    if (nameErr) { alert(nameErr); return; }
    setSaving(true);
    try {
      if (modal === 'add') await api.createVendorCandidate(form);
      else await api.updateVendorCandidate(modal.id, form);
      reload(); setModal(null);
    } catch (e) { alert(e.message); }
    setSaving(false);
  };

  const del = async (id) => { if (!confirm('Withdraw this candidate?')) return; await api.deleteVendorCandidate(id); reload(); };
  const filtered = batchFilter ? candidates.filter(c => String(c.batch_id) === batchFilter) : candidates;

  return (
    <div>
      <div style={S.pageTitle}>Candidate Management</div>
      <div style={S.pageSub}>All enrolled candidates</div>

      <div style={{ display:'flex', gap:8, marginBottom:12, alignItems:'center' }}>
        <select style={{ ...S.select, width:240 }} value={batchFilter} onChange={e => setBatchFilter(e.target.value)}>
          <option value="">All batches</option>
          {batches.map(b => <option key={b.id} value={b.id}>{b.batch_code} — {b.course_title||'?'}</option>)}
        </select>
        <span style={{ fontSize:12, color:'#64748B' }}>{filtered.length} candidates</span>
        <button style={{ ...S.btnPrimary, marginLeft:'auto' }} onClick={() => { setForm({}); setModal('add'); }}>+ Enrol Candidate</button>
      </div>

      <div style={S.tblWrap}>
        {busy ? <Empty icon="⏳" msg="Loading…" /> : filtered.length === 0 ? <Empty icon="👤" msg="No candidates enrolled yet" /> : (
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead><tr>
              {['Name','Mobile','Aadhaar','Batch','Scheme','Attendance','Placement','Status','Actions'].map(h => <th key={h} style={S.th}>{h}</th>)}
            </tr></thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id}>
                  <td style={S.td}><div style={{ fontWeight:600 }}>{c.name}</div><div style={{ fontSize:11, color:'#64748B' }}>{c.gender} · {c.category}</div></td>
                  <td style={S.td}>{c.mobile || '—'}</td>
                  <td style={S.td}>{c.aadhaar_masked || '—'}</td>
                  <td style={S.td}>{c.batch_code || '—'}</td>
                  <td style={S.td}>{c.scheme || '—'}</td>
                  <td style={S.td}>{c.attendance_pct != null ? `${c.attendance_pct}%` : '—'}</td>
                  <td style={S.td}>{statusPill(c.placement_status || 'not-placed')}</td>
                  <td style={S.td}>{statusPill(c.status)}</td>
                  <td style={S.td}>
                    <div style={{ display:'flex', gap:6 }}>
                      <button style={S.btnSm} onClick={() => { setForm({ ...c }); setModal(c); }}>Edit</button>
                      <button style={S.btnSmDanger} onClick={() => del(c.id)}>Del</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <Modal title={modal === 'add' ? 'Enrol Candidate' : 'Edit Candidate'} onClose={() => setModal(null)} wide>
          <div style={S.fGrid(2)}>
            <div style={{ ...S.fGroup, gridColumn:'1/-1' }}><label style={S.label}>Full name *</label><input style={S.input} value={fv('name')} onChange={f('name')} /></div>
            <div style={S.fGroup}><label style={S.label}>Mobile</label>
              <input style={{ ...S.input, ...(errors.mobile ? { borderColor:'#C0392B', background:'#FEF2F2' } : {}) }}
                value={fv('mobile')}
                onChange={e => { f('mobile')(e); clearErr('mobile'); }}
                onBlur={() => { const v = fv('mobile'); if (v) setErr('mobile', /^[6-9]\d{9}$/.test(v) ? '' : 'Must be a 10-digit number starting with 6–9'); }} />
              {errors.mobile && <div style={{ color:'#C0392B', fontSize:11, marginTop:3, fontWeight:500 }}>⚠ {errors.mobile}</div>}
            </div>
            <div style={S.fGroup}><label style={S.label}>Aadhaar (masked)</label>
              <input style={{ ...S.input, ...(errors.aadhaar_masked ? { borderColor:'#C0392B', background:'#FEF2F2' } : {}) }}
                value={fv('aadhaar_masked')} placeholder="XXXX-XXXX-1234"
                onChange={e => { f('aadhaar_masked')(e); clearErr('aadhaar_masked'); }}
                onBlur={() => { const v = fv('aadhaar_masked'); if (v) setErr('aadhaar_masked', /^\d{4}-\d{4}-\d{4}$/.test(v) ? '' : 'Format must be XXXX-XXXX-1234'); }} />
              {errors.aadhaar_masked && <div style={{ color:'#C0392B', fontSize:11, marginTop:3, fontWeight:500 }}>⚠ {errors.aadhaar_masked}</div>}
            </div>
            <div style={S.fGroup}><label style={S.label}>Date of birth</label><input style={S.input} type="date" value={fv('dob')} onChange={f('dob')} /></div>
            <div style={S.fGroup}><label style={S.label}>Gender</label>
              <select style={S.select} value={fv('gender')} onChange={f('gender')}>
                <option value="">Select</option>
                {GENDERS.map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div style={S.fGroup}><label style={S.label}>Category</label>
              <select style={S.select} value={fv('category')} onChange={f('category')}>
                <option value="">Select</option>
                {CATEGORIES.map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div style={S.fGroup}><label style={S.label}>Scheme</label>
              <select style={S.select} value={fv('scheme')} onChange={f('scheme')}>
                <option value="">Select</option>
                {SCHEMES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div style={S.fGroup}><label style={S.label}>Batch</label>
              <select style={S.select} value={fv('batch_id')} onChange={f('batch_id')}>
                <option value="">Select batch</option>
                {batches.map(b => <option key={b.id} value={b.id}>{b.batch_code} — {b.course_title||'?'}</option>)}
              </select>
            </div>
            <div style={S.fGroup}><label style={S.label}>Attendance %</label><input style={S.input} type="number" min="0" max="100" value={fv('attendance_pct')} onChange={f('attendance_pct')} /></div>
            <div style={S.fGroup}><label style={S.label}>Status</label>
              <select style={S.select} value={fv('status')} onChange={f('status')}>
                {CAND_STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div style={S.fGroup}><label style={S.label}>Placement status</label>
              <select style={S.select} value={fv('placement_status')} onChange={f('placement_status')}>
                {['not-placed','placed','self-employed','further-education'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div style={S.btnRow}>
            <button style={S.btn} onClick={() => setModal(null)}>Cancel</button>
            <button style={S.btnPrimary} onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Assessments ───────────────────────────────────────────────────────────────
function Assessments() {
  const { data: assessments, busy, reload } = useList(api.vendorAssessments);
  const { data: batches } = useList(api.vendorBatches);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));
  const fv = (k) => form[k] || '';

  const save = async () => {
    if (!form.batch_id) { alert('Please select a batch.'); return; }
    if (!form.scheduled_date) { alert('Assessment date is required.'); return; }
    const cntErr = validatePosInt(form.candidate_count, 'Number of candidates', 500);
    if (cntErr) { alert(cntErr); return; }
    setSaving(true);
    try {
      if (modal === 'add') await api.createVendorAssessment(form);
      else await api.updateVendorAssessment(modal.id, form);
      reload(); setModal(null);
    } catch (e) { alert(e.message); }
    setSaving(false);
  };

  const del = async (id) => { if (!confirm('Cancel assessment?')) return; await api.deleteVendorAssessment(id); reload(); };

  return (
    <div>
      <div style={S.pageTitle}>Assessments</div>
      <div style={S.pageSub}>Schedule and track candidate assessments</div>

      <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:12 }}>
        <button style={S.btnPrimary} onClick={() => { setForm({}); setModal('add'); }}>+ Schedule Assessment</button>
      </div>

      <div style={S.tblWrap}>
        {busy ? <Empty icon="⏳" msg="Loading…" /> : assessments.length === 0 ? <Empty icon="📋" msg="No assessments scheduled yet" /> : (
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead><tr>
              {['Batch','Course','Type','Agency','Date','Time slot','Candidates','Marks','Assessor','Status','Actions'].map(h => <th key={h} style={S.th}>{h}</th>)}
            </tr></thead>
            <tbody>
              {assessments.map(a => (
                <tr key={a.id}>
                  <td style={S.td}>{a.batch_code || '—'}</td>
                  <td style={S.td}>{a.course_title || '—'}</td>
                  <td style={S.td}>{a.type || '—'}</td>
                  <td style={S.td}>{a.agency || '—'}</td>
                  <td style={S.td}>{fmtDate(a.scheduled_date)}</td>
                  <td style={S.td}>{a.time_slot || '—'}</td>
                  <td style={S.td}>{a.candidate_count || 0}</td>
                  <td style={S.td}>{a.total_marks||100}/{a.passing_marks||50}</td>
                  <td style={S.td}>{a.assessor || '—'}</td>
                  <td style={S.td}>{statusPill(a.status)}</td>
                  <td style={S.td}>
                    <div style={{ display:'flex', gap:6 }}>
                      <button style={S.btnSm} onClick={() => { setForm({ ...a }); setModal(a); }}>Edit</button>
                      <button style={S.btnSmDanger} onClick={() => del(a.id)}>Del</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <Modal title={modal === 'add' ? 'Schedule Assessment' : 'Edit Assessment'} onClose={() => setModal(null)}>
          <div style={S.fGrid(1)}>
            <div style={S.fGroup}><label style={S.label}>Batch</label>
              <select style={S.select} value={fv('batch_id')} onChange={f('batch_id')}>
                <option value="">Select batch</option>
                {batches.map(b => <option key={b.id} value={b.id}>{b.batch_code} — {b.course_title||'?'}</option>)}
              </select>
            </div>
            <div style={S.fGroup}><label style={S.label}>Assessment agency</label>
              <select style={S.select} value={fv('agency')} onChange={f('agency')}>
                <option value="">Select agency</option>
                {ASSESSMENT_AGENCIES.map(a => <option key={a}>{a}</option>)}
              </select>
            </div>
            <div style={S.fGroup}><label style={S.label}>Preferred date</label><input style={S.input} type="date" value={fv('scheduled_date')} onChange={f('scheduled_date')} /></div>
            <div style={S.fGroup}><label style={S.label}>Time slot</label>
              <select style={S.select} value={fv('time_slot')} onChange={f('time_slot')}>
                <option value="">Select</option>
                {['9:00 AM – 12:00 PM','12:00 PM – 3:00 PM','2:00 PM – 5:00 PM','Full day'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div style={S.fGroup}><label style={S.label}>Number of candidates</label><input style={S.input} type="number" value={fv('candidate_count')} onChange={f('candidate_count')} /></div>
            <div style={S.fGroup}><label style={S.label}>Assessment Type</label>
              <select style={S.select} value={fv('type')} onChange={f('type')}>
                <option value="">Select</option>
                {['Final','Mid-term','Mock','RPL'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div style={S.fGroup}><label style={S.label}>Total Marks</label><input style={S.input} type="number" value={fv('total_marks')} onChange={f('total_marks')} placeholder="100" /></div>
            <div style={S.fGroup}><label style={S.label}>Passing Marks</label><input style={S.input} type="number" value={fv('passing_marks')} onChange={f('passing_marks')} placeholder="50" /></div>
            <div style={S.fGroup}><label style={S.label}>Assessor Name</label><input style={S.input} value={fv('assessor')} onChange={f('assessor')} placeholder="e.g. SSC-Designated Assessor" /></div>
            <div style={S.fGroup}><label style={S.label}>Duration (hrs)</label><input style={S.input} type="number" value={fv('duration_hrs')} onChange={f('duration_hrs')} placeholder="2" /></div>
            <div style={S.fGroup}><label style={S.label}>Status</label>
              <select style={S.select} value={fv('status')} onChange={f('status')}>
                {['scheduled','completed','cancelled'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div style={S.btnRow}>
            <button style={S.btn} onClick={() => setModal(null)}>Cancel</button>
            <button style={S.btnPrimary} onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Documents ─────────────────────────────────────────────────────────────────
function Documents() {
  const { data: docs, busy, reload } = useList(api.vendorDocuments);
  const [uploading, setUploading] = useState(null);
  const [expiry, setExpiry] = useState('');
  const [saving, setSaving] = useState(false);

  const docMap = {};
  docs.forEach(d => { docMap[d.doc_type] = d; });

  const upload = async (doc_type, label) => {
    setUploading({ doc_type, label }); setExpiry('');
  };

  const saveDoc = async () => {
    if (!uploading) return;
    setSaving(true);
    try {
      await api.uploadVendorDocument({ doc_type: uploading.doc_type, filename: uploading.label + ' (uploaded)', expiry_date: expiry || null });
      reload(); setUploading(null);
    } catch (e) { alert(e.message); }
    setSaving(false);
  };

  const del = async (id) => { if (!confirm('Delete this document?')) return; await api.deleteVendorDocument(id); reload(); };

  return (
    <div>
      <div style={S.pageTitle}>Documents</div>
      <div style={S.pageSub}>Upload and manage compliance documents</div>

      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {DOC_TYPES.map(({ key, label }) => {
          const doc = docMap[key];
          let col = 'gray', statusLabel = 'Not uploaded';
          if (doc) {
            if (doc.status === 'expiring') { col = 'amber'; statusLabel = 'Expiring soon'; }
            else { col = 'green'; statusLabel = 'Uploaded'; }
          }
          return (
            <div key={key} style={{ display:'flex', alignItems:'center', gap:12, padding:12, background:'#fff', border:'1px solid #E2E8F0', borderRadius:8 }}>
              <span style={{ fontSize:20 }}>📄</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:600, color:'#0B1E3D' }}>{label}</div>
                {doc && doc.expiry_date && <div style={{ fontSize:11, color:'#94A3B8' }}>Expiry: {fmtDate(doc.expiry_date)}</div>}
              </div>
              <Pill col={col}>{statusLabel}</Pill>
              {doc ? (
                <div style={{ display:'flex', gap:6 }}>
                  <button style={S.btnSm} onClick={() => upload(key, label)}>Re-upload</button>
                  <button style={S.btnSmDanger} onClick={() => del(doc.id)}>Del</button>
                </div>
              ) : (
                <button style={S.btnSmPrimary} onClick={() => upload(key, label)}>Upload</button>
              )}
            </div>
          );
        })}
      </div>

      {uploading && (
        <Modal title={`Upload: ${uploading.label}`} onClose={() => setUploading(null)}>
          <div style={S.alert('info')}>ℹ️ File upload is simulated. In production, files would be sent to secure storage.</div>
          <div style={{ ...S.fGroup, marginBottom:12 }}>
            <label style={S.label}>Expiry date (if applicable)</label>
            <input style={S.input} type="date" value={expiry} onChange={e => setExpiry(e.target.value)} />
          </div>
          <div style={{ border:'2px dashed #CBD5E1', borderRadius:8, padding:30, textAlign:'center', color:'#94A3B8', cursor:'pointer', marginBottom:12 }}>
            <div style={{ fontSize:32, marginBottom:8 }}>📤</div>
            <div style={{ fontSize:13 }}>Click to select file (PDF, max 5 MB)</div>
          </div>
          <div style={S.btnRow}>
            <button style={S.btn} onClick={() => setUploading(null)}>Cancel</button>
            <button style={S.btnPrimary} onClick={saveDoc} disabled={saving}>{saving ? 'Saving…' : 'Mark as uploaded'}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Reports ───────────────────────────────────────────────────────────────────
function Reports() {
  const { data: batches } = useList(api.vendorBatches);
  const { data: candidates } = useList(api.vendorCandidates);
  const { data: centres } = useList(api.vendorCentres);

  const total = candidates.length;
  const enrolled = candidates.filter(c => c.status === 'enrolled').length;
  const completed = candidates.filter(c => c.status === 'completed').length;
  const placed = candidates.filter(c => c.placement_status === 'placed').length;
  const placePct = total > 0 ? Math.round((placed / total) * 100) : 0;

  return (
    <div>
      <div style={S.pageTitle}>Reports & MIS</div>
      <div style={S.pageSub}>Training and placement performance summary</div>

      <div style={S.statGrid}>
        {[
          { v: centres.length, l:'Total Centres' },
          { v: batches.length, l:'Total Batches' },
          { v: total, l:'Total Candidates' },
          { v: `${placePct}%`, l:'Placement Rate' },
        ].map(({ v, l }) => (
          <div key={l} style={S.stat}>
            <div style={{ fontSize:22, fontWeight:700, color:'#0A2D6E' }}>{v}</div>
            <div style={{ fontSize:12, color:'#64748B', marginTop:3 }}>{l}</div>
          </div>
        ))}
      </div>

      <div style={S.card}>
        <div style={S.cardTitle}>Batch-wise summary</div>
        {batches.length === 0 ? <Empty icon="📊" msg="No batches yet" /> : (
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead><tr>
              {['Batch','Course','Centre','Start','End','Capacity','Enrolled','Status'].map(h => <th key={h} style={S.th}>{h}</th>)}
            </tr></thead>
            <tbody>
              {batches.map(b => (
                <tr key={b.id}>
                  <td style={S.td}><span style={{ fontWeight:700, color:'#0A2D6E' }}>{b.batch_code}</span></td>
                  <td style={S.td}>{b.course_title || '—'}</td>
                  <td style={S.td}>{b.centre_name || '—'}</td>
                  <td style={S.td}>{fmtDate(b.start_date)}</td>
                  <td style={S.td}>{fmtDate(b.end_date)}</td>
                  <td style={S.td}>{b.capacity}</td>
                  <td style={S.td}>{b.enrolled}</td>
                  <td style={S.td}>{statusPill(b.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={S.card}>
        <div style={S.cardTitle}>Candidate status breakdown</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
          {[
            { l:'Enrolled', v: enrolled, col:'#DBEAFE', tc:'#1E40AF' },
            { l:'Completed', v: completed, col:'#D1FAE5', tc:'#065F46' },
            { l:'Placed', v: placed, col:'#D1FAE5', tc:'#065F46' },
            { l:'Dropout', v: candidates.filter(c=>c.status==='dropout').length, col:'#FEE2E2', tc:'#991B1B' },
          ].map(({ l, v, col, tc }) => (
            <div key={l} style={{ background:col, borderRadius:8, padding:'12px 14px', textAlign:'center' }}>
              <div style={{ fontSize:22, fontWeight:700, color:tc }}>{v}</div>
              <div style={{ fontSize:11, color:tc, marginTop:3 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Grievances ────────────────────────────────────────────────────────────────
function Grievances() {
  const { data: tickets, busy, reload } = useList(api.vendorGrievances);
  const [form, setForm] = useState({ category:'Profile / Registration', priority:'normal', subject:'', details:'' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const submit = async () => {
    if (!form.subject) { alert('Subject is required'); return; }
    const subjectErr = validateText(form.subject, 'Subject', { min: 5, max: 200 });
    if (subjectErr) { alert(subjectErr); return; }
    const detailsErr = validateText(form.details, 'Details', { min: 10, max: 2000 });
    if (detailsErr) { alert(detailsErr); return; }
    setSaving(true);
    try {
      const r = await api.createVendorGrievance(form);
      setMsg(`Ticket ${r.ticket_no} raised successfully.`);
      setForm({ category:'Profile / Registration', priority:'normal', subject:'', details:'' });
      reload();
    } catch (e) { alert(e.message); }
    setSaving(false);
  };

  return (
    <div>
      <div style={S.pageTitle}>Grievance & Support</div>
      <div style={S.pageSub}>Raise a ticket or track existing issues</div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
        <div>
          {msg && <div style={S.alert('success')}>✓ {msg}</div>}
          <div style={S.card}>
            <div style={S.cardTitle}>Raise new ticket</div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <div style={S.fGroup}><label style={S.label}>Category</label>
                <select style={S.select} value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                  {['Profile / Registration','Training Centre','Batch / Course','Assessment','Certificate','Payment','Technical issue','Other'].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div style={S.fGroup}><label style={S.label}>Priority</label>
                <select style={S.select} value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}>
                  {['normal','high','critical'].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div style={S.fGroup}><label style={S.label}>Subject *</label>
                <input style={S.input} value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} placeholder="Brief description" />
              </div>
              <div style={S.fGroup}><label style={S.label}>Details</label>
                <textarea style={S.textarea} value={form.details} onChange={e => setForm(p => ({ ...p, details: e.target.value }))} placeholder="Describe the issue in detail…" />
              </div>
              <div style={{ ...S.alert('info'), marginBottom:0 }}>ℹ️ SLA: 3 working days (standard) · 24 hours (critical)</div>
              <button style={S.btnPrimary} onClick={submit} disabled={saving}>{saving ? 'Submitting…' : 'Submit ticket'}</button>
            </div>
          </div>
        </div>

        <div>
          <div style={{ ...S.cardTitle, fontSize:11, fontWeight:700, color:'#7886A6', textTransform:'uppercase', letterSpacing:.5, marginBottom:10 }}>My tickets</div>
          {busy ? <Empty icon="⏳" msg="Loading…" /> : tickets.length === 0 ? <Empty icon="🎫" msg="No tickets raised yet" /> : tickets.map(t => (
            <div key={t.id} style={{ background:'#fff', border:'1px solid #E2E8F0', borderRadius:8, padding:'10px 14px', marginBottom:8 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                <span style={{ fontWeight:700, fontSize:12, color:'#0A2D6E' }}>{t.ticket_no}</span>
                {statusPill(t.status)}
                <Pill col={t.priority==='critical'?'red':t.priority==='high'?'amber':'gray'}>{t.priority}</Pill>
                <span style={{ marginLeft:'auto', fontSize:11, color:'#94A3B8' }}>{fmtDate(t.created_at)}</span>
              </div>
              <div style={{ fontSize:12, fontWeight:600, color:'#334155' }}>{t.subject}</div>
              <div style={{ fontSize:11, color:'#64748B', marginTop:2 }}>{t.category}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COLLABORATION PANELS
// ═══════════════════════════════════════════════════════════════════════════════

const PARTNER_TYPES = ['Training Partner','NGO','Employer','Assessment Agency','Placement Partner','Educational Institution','CSR Implementation Partner'];
const STATES_LIST = ['Andhra Pradesh','Telangana','Karnataka','Tamil Nadu','Maharashtra','Delhi','Uttar Pradesh','Gujarat','Rajasthan','West Bengal','Odisha','Madhya Pradesh'];
const SECTORS_COL = ['IT / ITeS','Healthcare','Construction','Logistics','Agriculture','Retail','BFSI','Automotive','Beauty & Wellness','Green Jobs','Textile','Tourism'];

// ── Org Picker Dropdown ───────────────────────────────────────────────────────
function OrgPickerField({ partners, invitePickerPartners, invForm, setInvForm, toggleOrgSelect }) {
  const [open, setOpen] = useState(false);
  const selectedNames = invForm.inviteAll
    ? [`All (${partners.length})`]
    : partners.filter(p => invForm.selectedIds.includes(p.id)).map(p => p.org_name);

  return (
    <div style={{ ...S.fGroup, gridColumn:'1/-1', position:'relative' }}>
      <label style={S.label}>Organisations *</label>

      {/* Classification filter chips */}
      <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:8 }}>
        {['All', ...PARTNER_TYPES].map(cls => (
          <button key={cls} onClick={() => {
            if (cls === 'All') setInvForm(p => ({ ...p, classification:'', selectedIds:[], inviteAll:true }));
            else setInvForm(p => ({ ...p, classification: p.classification === cls ? '' : cls, inviteAll:false, selectedIds:[] }));
          }} style={{ padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:600, cursor:'pointer', border:'1px solid #CBD5E1',
            background: cls === 'All' ? (invForm.inviteAll ? '#0A2D6E' : '#F1F5F9') : (invForm.classification === cls ? '#0A2D6E' : '#F1F5F9'),
            color: (cls === 'All' ? invForm.inviteAll : invForm.classification === cls) ? '#fff' : '#475569' }}>
            {cls}
          </button>
        ))}
      </div>

      {/* Dropdown trigger */}
      {!invForm.inviteAll && (
        <div style={{ position:'relative' }}>
          <div onClick={() => setOpen(o => !o)}
            style={{ ...S.input, cursor:'pointer', display:'flex', alignItems:'center', flexWrap:'wrap', gap:4, minHeight:38, height:'auto', padding:'6px 10px', userSelect:'none' }}>
            {selectedNames.length === 0
              ? <span style={{ color:'#94A3B8', fontSize:12 }}>Select organisations…</span>
              : selectedNames.map(name => (
                  <span key={name} style={{ background:'#EFF6FF', color:'#1D4ED8', fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:12, border:'1px solid #BFDBFE' }}>
                    {name}
                  </span>
                ))
            }
            <span style={{ marginLeft:'auto', color:'#94A3B8', fontSize:12 }}>{open ? '▲' : '▼'}</span>
          </div>

          {open && (
            <div style={{ position:'absolute', top:'100%', left:0, right:0, zIndex:999, background:'#fff', border:'1px solid #E2E8F0', borderRadius:8, boxShadow:'0 8px 24px rgba(0,0,0,0.12)', maxHeight:220, overflowY:'auto', marginTop:2 }}>
              {invitePickerPartners.length === 0
                ? <div style={{ padding:'14px 12px', fontSize:12, color:'#94A3B8' }}>No organisations found for this classification.</div>
                : invitePickerPartners.map(p => {
                    const sel = invForm.selectedIds.includes(p.id);
                    return (
                      <div key={p.id} onClick={() => toggleOrgSelect(p.id)}
                        style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', cursor:'pointer',
                          background: sel ? '#EFF6FF' : '#fff', borderBottom:'1px solid #F1F5F9' }}>
                        <div style={{ width:16, height:16, borderRadius:3, border:`2px solid ${sel ? '#0A2D6E' : '#CBD5E1'}`,
                          background: sel ? '#0A2D6E' : '#fff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                          {sel && <span style={{ color:'#fff', fontSize:10, fontWeight:700, lineHeight:1 }}>✓</span>}
                        </div>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:12, fontWeight:600, color:'#0B1E3D' }}>{p.org_name}</div>
                          <div style={{ fontSize:11, color:'#64748B' }}>{p.type || 'Training Partner'} · {p.state || '—'}{p.sector ? ` · ${p.sector}` : ''}</div>
                        </div>
                      </div>
                    );
                  })
              }
            </div>
          )}
        </div>
      )}

      {invForm.inviteAll && (
        <div style={{ ...S.alert('info'), marginTop:0 }}>ℹ️ Invitation will be sent to <strong>all {partners.length} organisations</strong> in the directory.</div>
      )}
      {!invForm.inviteAll && invForm.selectedIds.length > 0 && (
        <div style={{ fontSize:11, color:'#0A2D6E', marginTop:4, fontWeight:600 }}>{invForm.selectedIds.length} organisation{invForm.selectedIds.length > 1 ? 's' : ''} selected</div>
      )}
    </div>
  );
}

// ── Consortium Builder ────────────────────────────────────────────────────────
function CollabConsortium() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [sectorFilter, setSectorFilter] = useState('');
  const [modal, setModal] = useState(null);
  const [invForm, setInvForm] = useState({ selectedIds:[], inviteAll:false, classification:'', invitation_type:'Consortium Invitation', project_name:'', sector:'', state:'', message:'' });
  const [partners, setPartners] = useState([]);
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.collabConsortium().then(data => setPartners(Array.isArray(data) ? data : [])).catch(()=>{}).finally(()=>setBusy(false));
  }, []);

  const filtered = partners.filter(p => {
    const q = search.toLowerCase();
    return (!q || (p.org_name||'').toLowerCase().includes(q) || (p.sector||'').toLowerCase().includes(q) || (p.state||'').toLowerCase().includes(q))
      && (!typeFilter || p.type === typeFilter)
      && (!sectorFilter || p.sector === sectorFilter || p.sector === 'Multiple');
  });

  // Partners visible in the invite modal's org picker after classification filter
  const invitePickerPartners = invForm.classification
    ? partners.filter(p => p.type === invForm.classification)
    : partners;

  const toggleOrgSelect = (id) => {
    setInvForm(p => {
      const ids = p.selectedIds.includes(id) ? p.selectedIds.filter(x => x !== id) : [...p.selectedIds, id];
      return { ...p, selectedIds: ids, inviteAll: false };
    });
  };

  const sendInvitation = async () => {
    if (!invForm.invitation_type || !invForm.project_name) return alert('Invitation type and project name are required.');
    const projErr = validateText(invForm.project_name, 'Project name', { min: 3, max: 200 });
    if (projErr) return alert(projErr);
    if (!invForm.inviteAll && invForm.selectedIds.length === 0) return alert('Select at least one organisation.');
    setSaving(true);
    try {
      const targets = invForm.inviteAll ? partners : partners.filter(p => invForm.selectedIds.includes(p.id));
      // Also allow a pre-selected partner from card button
      const cardPartner = modal?.partner;
      const toSend = targets.length > 0 ? targets : (cardPartner ? [cardPartner] : []);
      if (toSend.length === 0) { alert('No organisations selected.'); setSaving(false); return; }
      await Promise.all(toSend.map(p =>
        api.collabSendInvitation({ to_vendor_id: p.id || null, to_org_name: p.org_name || null, invitation_type: invForm.invitation_type, project_name: invForm.project_name, sector: invForm.sector, state: invForm.state, message: invForm.message })
      ));
      alert(`Invitation sent to ${toSend.length} organisation${toSend.length > 1 ? 's' : ''}!`);
      setModal(null);
      setInvForm({ selectedIds:[], inviteAll:false, classification:'', invitation_type:'Consortium Invitation', project_name:'', sector:'', state:'', message:'' });
    } catch(e) { alert('Failed to send invitation. Please try again.'); }
    finally { setSaving(false); }
  };

  const typeIcon = { 'Training Partner':'🎓','NGO':'🤝','Employer':'🏭','Assessment Agency':'📋','Placement Partner':'💼','Educational Institution':'🏫','CSR Implementation Partner':'🌱' };

  return (
    <div>
      <div style={S.pageTitle}>Consortium Builder</div>
      <div style={S.pageSub}>Identify and connect with suitable partners for Government, CSR and Corporate projects</div>

      <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap', alignItems:'center' }}>
        <input style={{ ...S.input, width:220 }} placeholder="Search by name, sector, state…" value={search} onChange={e => setSearch(e.target.value)} />
        <select style={{ ...S.select, width:200 }} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="">All Partner Types</option>
          {PARTNER_TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
        <select style={{ ...S.select, width:160 }} value={sectorFilter} onChange={e => setSectorFilter(e.target.value)}>
          <option value="">All Sectors</option>
          {SECTORS_COL.map(s => <option key={s}>{s}</option>)}
        </select>
        <span style={{ fontSize:12, color:'#64748B' }}>{busy ? 'Loading…' : `${filtered.length} organisations found`}</span>
        <button style={{ ...S.btnPrimary, marginLeft:'auto' }} onClick={() => setModal('invite')}>+ Send Consortium Invitation</button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12, marginBottom:14 }}>
        {filtered.map(p => (
          <div key={p.id} style={{ ...S.card, display:'flex', gap:14, alignItems:'flex-start' }}>
            <div style={{ width:44, height:44, borderRadius:10, background:'#EFF6FF', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>{typeIcon[p.type]||'🏢'}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:700, color:'#0B1E3D', marginBottom:2 }}>{p.org_name}</div>
              <div style={{ fontSize:11, color:'#64748B', marginBottom:6 }}>{p.type || 'Training Partner'} · {p.state || '—'}</div>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:8 }}>
                <Pill col="blue">{p.sector || 'Multiple'}</Pill>
                {p.city && <Pill col="gray">{p.city}</Pill>}
              </div>
              <div style={{ display:'flex', gap:6 }}>
                <button style={S.btnSmPrimary} onClick={() => setModal({ type:'invite', partner: p })}>Invite</button>
                <button style={S.btnSm} onClick={() => setModal({ type:'view', partner: p })}>View Profile</button>
                <button style={{ ...S.btnSm, borderColor:'#10B981', color:'#065F46' }}>Express Interest</button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div style={{ gridColumn:'1/-1' }}><Empty icon="🤝" msg="No partners found. Try adjusting filters." /></div>}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
        {[
          { l:'Total Partners', v: partners.length, col:'#0A2D6E' },
          { l:'Training Partners', v: partners.filter(p=>p.type==='Training Partner').length, col:'#0F6E56' },
          { l:'Employers', v: partners.filter(p=>p.type==='Employer').length, col:'#B45309' },
          { l:'NGOs & CSR', v: partners.filter(p=>['NGO','CSR Implementation Partner'].includes(p.type)).length, col:'#6D28D9' },
        ].map(({ l, v, col }) => (
          <div key={l} style={S.stat}>
            <div style={{ fontSize:22, fontWeight:700, color:col }}>{v}</div>
            <div style={{ fontSize:12, color:'#64748B', marginTop:2 }}>{l}</div>
          </div>
        ))}
      </div>

      {modal === 'invite' || (modal && modal.type === 'invite') ? (
        <Modal title="Send Consortium Invitation" onClose={() => setModal(null)} wide>
          <div style={S.fGrid(2)}>

            {/* ── Organisation Picker ── */}
            <OrgPickerField
              partners={partners}
              invitePickerPartners={invitePickerPartners}
              invForm={invForm}
              setInvForm={setInvForm}
              toggleOrgSelect={toggleOrgSelect}
            />

            <div style={S.fGroup}><label style={S.label}>Invitation type *</label>
              <select style={S.select} value={invForm.invitation_type} onChange={e => setInvForm(p=>({...p, invitation_type:e.target.value}))}>
                {['Consortium Invitation','Partnership Invitation','Resource Sharing Request','Joint Project Invitation','Employer Collaboration Request'].map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
            <div style={S.fGroup}><label style={S.label}>Project / Consortium name *</label>
              <input style={S.input} value={invForm.project_name} onChange={e => setInvForm(p=>({...p, project_name:e.target.value}))} placeholder="e.g. DDU-GKY Phase 3 Consortium" /></div>
            <div style={S.fGroup}><label style={S.label}>Sector</label>
              <select style={S.select} value={invForm.sector} onChange={e => setInvForm(p=>({...p, sector:e.target.value}))}>
                <option value="">Select</option>{SECTORS_COL.map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
            <div style={S.fGroup}><label style={S.label}>State</label>
              <select style={S.select} value={invForm.state} onChange={e => setInvForm(p=>({...p, state:e.target.value}))}>
                <option value="">Select</option>{STATES_LIST.map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ ...S.fGroup, gridColumn:'1/-1' }}><label style={S.label}>Message / Invitation note</label>
              <textarea style={S.textarea} value={invForm.message} onChange={e => setInvForm(p=>({...p, message:e.target.value}))} placeholder="Describe the collaboration opportunity, requirements and expected contribution…" />
            </div>
          </div>
          <div style={S.btnRow}>
            <button style={S.btn} onClick={() => setModal(null)}>Cancel</button>
            <button style={S.btnPrimary} disabled={saving} onClick={sendInvitation}>{saving ? 'Sending…' : 'Send Invitation'}</button>
          </div>
        </Modal>
      ) : modal && modal.type === 'view' ? (
        <Modal title={modal.partner.org_name} onClose={() => setModal(null)}>
          <div style={{ display:'flex', gap:12, alignItems:'center', marginBottom:16 }}>
            <div style={{ width:52, height:52, borderRadius:12, background:'#EFF6FF', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28 }}>{typeIcon[modal.partner.type]||'🏢'}</div>
            <div>
              <div style={{ fontSize:14, fontWeight:700, color:'#0B1E3D' }}>{modal.partner.org_name}</div>
              <div style={{ fontSize:12, color:'#64748B' }}>{modal.partner.type || 'Training Partner'} · {modal.partner.state || '—'}</div>
            </div>
          </div>
          {[['Sector', modal.partner.sector||'—'],['City', modal.partner.city||'—'],['State', modal.partner.state||'—'],['Member since', fmtDate(modal.partner.member_since)]].map(([l,v]) => (
            <div key={l} style={{ display:'flex', padding:'8px 0', borderBottom:'1px solid #F8FAFF' }}>
              <span style={{ width:180, fontSize:12, color:'#64748B' }}>{l}</span>
              <span style={{ fontSize:12, fontWeight:600 }}>{v}</span>
            </div>
          ))}
          <div style={S.btnRow}>
            <button style={S.btn} onClick={() => setModal(null)}>Close</button>
            <button style={S.btnPrimary} onClick={() => setModal({ type:'invite', partner: modal.partner })}>Send Invitation</button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}

// ── Partnership Requests ──────────────────────────────────────────────────────
function CollabPartnership() {
  const [tab, setTab] = useState('browse');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ lookingFor:'', sector:'', state:'', description:'', project_type:'' });
  const [allRequests, setAllRequests] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [respondMsg, setRespondMsg] = useState('');

  const loadRequests = () => {
    setBusy(true);
    api.collabPartnershipRequests().then(data => {
      setAllRequests(data.all || []);
      setMyRequests(data.mine || []);
    }).catch(()=>{}).finally(()=>setBusy(false));
  };
  useEffect(loadRequests, []);

  const postRequest = async () => {
    if (!form.lookingFor) return alert('Please select what you are looking for.');
    setSaving(true);
    try {
      await api.collabPostPartnershipRequest({ looking_for: form.lookingFor, sector: form.sector, state: form.state, project_type: form.project_type, description: form.description });
      setModal(null);
      setForm({ lookingFor:'', sector:'', state:'', description:'', project_type:'' });
      loadRequests();
    } catch(e) { alert('Failed to post request.'); }
    finally { setSaving(false); }
  };

  const respondToRequest = async (id) => {
    setSaving(true);
    try {
      await api.collabRespondToRequest(id, respondMsg);
      alert('Interest expressed successfully!');
      setModal(null);
      setRespondMsg('');
      loadRequests();
    } catch(e) { alert('Failed to express interest.'); }
    finally { setSaving(false); }
  };

  const closeRequest = async (id) => {
    if (!window.confirm('Close this partnership request?')) return;
    try { await api.collabClosePartnershipRequest(id); loadRequests(); } catch(e) { alert('Failed to close request.'); }
  };

  const lookingForOptions = ['Training Partner','Employer Partner','Placement Partner','CSR Partner','University / College Partner','Assessment Agency','Infrastructure','Training Centres','Trainer'];

  return (
    <div>
      <div style={S.pageTitle}>Partnership Requests</div>
      <div style={S.pageSub}>Publish your collaboration requirements and respond to partner requests</div>

      <div style={{ display:'flex', gap:8, marginBottom:14, borderBottom:'1px solid #E2E8F0', paddingBottom:10 }}>
        {[{ key:'browse', label:'Browse Requests' },{ key:'mine', label:'My Requests' }].map(t => (
          <button key={t.key} style={{ padding:'6px 16px', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer', border:'none',
            background: tab===t.key ? '#0A2D6E':'#F1F5F9', color: tab===t.key ? '#fff':'#475569' }}
            onClick={() => setTab(t.key)}>{t.label}</button>
        ))}
        <button style={{ ...S.btnPrimary, marginLeft:'auto' }} onClick={() => setModal('post')}>+ Post a Request</button>
      </div>

      {tab === 'browse' && (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {busy && <div style={{ color:'#64748B', fontSize:13 }}>Loading…</div>}
          {!busy && allRequests.length === 0 && <Empty icon="📢" msg="No open partnership requests found." />}
          {allRequests.map(r => (
            <div key={r.id} style={{ ...S.card, display:'flex', alignItems:'center', gap:14 }}>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:4 }}>
                  <span style={{ fontSize:13, fontWeight:700, color:'#0B1E3D' }}>{r.org_name}</span>
                  <Pill col="blue">Looking for {r.looking_for}</Pill>
                </div>
                <div style={{ fontSize:12, color:'#64748B', marginBottom:6 }}>Sector: {r.sector||'—'} · State: {r.state||'—'} · {fmtDate(r.created_at)}</div>
                <div style={{ display:'flex', gap:8 }}>
                  <Pill col="green">{r.response_count||0} responses</Pill>
                  {statusPill(r.status)}
                </div>
              </div>
              <div style={{ display:'flex', gap:6 }}>
                <button style={S.btnSmPrimary} onClick={() => { setRespondMsg(''); setModal({ type:'respond', req: r }); }}>Express Interest</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'mine' && (
        <div>
          {busy && <div style={{ color:'#64748B', fontSize:13 }}>Loading…</div>}
          {!busy && myRequests.length === 0 ? <Empty icon="📢" msg="You haven't posted any partnership requests yet." /> : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {myRequests.map(r => (
                <div key={r.id} style={{ ...S.card, display:'flex', alignItems:'center', gap:14 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:4 }}>
                      <span style={{ fontSize:13, fontWeight:700, color:'#0B1E3D' }}>Looking for {r.looking_for}</span>
                      {statusPill(r.status)}
                    </div>
                    <div style={{ fontSize:12, color:'#64748B' }}>Sector: {r.sector||'—'} · State: {r.state||'—'} · {fmtDate(r.created_at)}</div>
                    {r.description && <div style={{ fontSize:12, color:'#475569', marginTop:4 }}>{r.description}</div>}
                  </div>
                  <div style={{ textAlign:'center' }}>
                    <div style={{ fontSize:20, fontWeight:700, color:'#0A2D6E' }}>{r.response_count||0}</div>
                    <div style={{ fontSize:11, color:'#64748B' }}>Responses</div>
                  </div>
                  <div style={{ display:'flex', gap:6 }}>
                    {r.status === 'open' && <button style={S.btnSmDanger} onClick={() => closeRequest(r.id)}>Close Request</button>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {modal === 'post' && (
        <Modal title="Post a Partnership Request" onClose={() => setModal(null)} wide>
          <div style={S.fGrid(2)}>
            <div style={S.fGroup}><label style={S.label}>Looking for *</label>
              <select style={S.select} value={form.lookingFor} onChange={e => setForm(p=>({...p,lookingFor:e.target.value}))}>
                <option value="">Select partner type</option>{lookingForOptions.map(o=><option key={o}>{o}</option>)}
              </select>
            </div>
            <div style={S.fGroup}><label style={S.label}>Sector</label>
              <select style={S.select} value={form.sector} onChange={e => setForm(p=>({...p,sector:e.target.value}))}>
                <option value="">Select</option>{SECTORS_COL.map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
            <div style={S.fGroup}><label style={S.label}>Preferred State</label>
              <select style={S.select} value={form.state} onChange={e => setForm(p=>({...p,state:e.target.value}))}>
                <option value="">Select</option>{STATES_LIST.map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
            <div style={S.fGroup}><label style={S.label}>Project / Requirement type</label>
              <select style={S.select} value={form.project_type} onChange={e => setForm(p=>({...p,project_type:e.target.value}))}>
                <option value="">Select</option>{['Government Project','CSR Project','Corporate Training','Self-financed'].map(o=><option key={o}>{o}</option>)}
              </select>
            </div>
            <div style={{ ...S.fGroup, gridColumn:'1/-1' }}><label style={S.label}>Description *</label>
              <textarea style={S.textarea} value={form.description} onChange={e => setForm(p=>({...p,description:e.target.value}))}
                placeholder="Describe what kind of partner you're looking for, your project details and requirements…" />
            </div>
          </div>
          <div style={S.btnRow}>
            <button style={S.btn} onClick={() => setModal(null)}>Cancel</button>
            <button style={S.btnPrimary} disabled={saving} onClick={postRequest}>{saving ? 'Posting…' : 'Post Request'}</button>
          </div>
        </Modal>
      )}

      {modal && modal.type === 'respond' && (
        <Modal title={`Express Interest — ${modal.req.org_name}`} onClose={() => setModal(null)}>
          <div style={S.alert('info')}>ℹ️ You are expressing interest in {modal.req.org_name}'s request for a <strong>{modal.req.looking_for}</strong>.</div>
          <div style={{ ...S.fGroup, marginBottom:12, marginTop:10 }}><label style={S.label}>Message to {modal.req.org_name}</label>
            <textarea style={S.textarea} value={respondMsg} onChange={e => setRespondMsg(e.target.value)} placeholder="Introduce your organisation and describe why you're a good fit for this partnership…" />
          </div>
          <div style={S.btnRow}>
            <button style={S.btn} onClick={() => setModal(null)}>Cancel</button>
            <button style={S.btnPrimary} disabled={saving} onClick={() => respondToRequest(modal.req.id)}>{saving ? 'Sending…' : 'Send Expression of Interest'}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Resource Sharing ──────────────────────────────────────────────────────────
function CollabResourceSharing() {
  const [tab, setTab] = useState('available');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [reqForm, setReqForm] = useState({ qty_needed:1, required_dates:'', message:'' });
  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }));
  const [allResources, setAllResources] = useState([]);
  const [myResources, setMyResources] = useState([]);
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);

  const RESOURCE_TYPES = ['Trainers','Training Centres','Classrooms','Computer Labs','Hostels','Equipment & Machinery','Mobile Training Units','Assessment Facilities'];

  const resIcon = { 'Trainers':'👨‍🏫','Training Centres':'🏢','Classrooms':'🏫','Computer Labs':'💻','Hostels':'🏠','Equipment & Machinery':'🔧','Mobile Training Units':'🚌','Assessment Facilities':'📋' };

  const loadResources = () => {
    setBusy(true);
    api.collabResources().then(data => {
      setAllResources(data.all || []);
      setMyResources(data.mine || []);
    }).catch(()=>{}).finally(()=>setBusy(false));
  };
  useEffect(loadResources, []);

  const listResource = async () => {
    if (!form.type || !form.listing) return alert('Resource type and listing type are required.');
    setSaving(true);
    try {
      await api.collabListResource({ resource_type: form.type, qty: form.qty||1, location: form.location||null, availability: form.availability||null, sector: form.sector||null, listing_type: form.listing.startsWith('Offering') ? 'offering' : 'requesting', details: form.details||null });
      alert('Resource listed!');
      setModal(null);
      setForm({});
      loadResources();
    } catch(e) { alert('Failed to list resource.'); }
    finally { setSaving(false); }
  };

  const requestResource = async (id) => {
    setSaving(true);
    try {
      await api.collabRequestResource(id, { qty_needed: reqForm.qty_needed, required_dates: reqForm.required_dates||null, message: reqForm.message||null });
      alert('Request sent!');
      setModal(null);
      setReqForm({ qty_needed:1, required_dates:'', message:'' });
    } catch(e) { alert('Failed to send request.'); }
    finally { setSaving(false); }
  };

  const deleteResource = async (id) => {
    if (!window.confirm('Remove this listing?')) return;
    try { await api.collabDeleteResource(id); loadResources(); } catch(e) { alert('Failed to delete resource.'); }
  };

  return (
    <div>
      <div style={S.pageTitle}>Resource Sharing</div>
      <div style={S.pageSub}>Offer or request available resources from partner organisations</div>

      <div style={{ display:'flex', gap:8, marginBottom:14, borderBottom:'1px solid #E2E8F0', paddingBottom:10 }}>
        {[{ key:'available', label:'Available Resources' },{ key:'requested', label:'Resources Requested' },{ key:'mine', label:'My Listings' }].map(t => (
          <button key={t.key} style={{ padding:'6px 16px', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer', border:'none',
            background: tab===t.key ? '#0A2D6E':'#F1F5F9', color: tab===t.key ? '#fff':'#475569' }}
            onClick={() => setTab(t.key)}>{t.label}</button>
        ))}
        <button style={{ ...S.btnPrimary, marginLeft:'auto' }} onClick={() => setModal('list')}>+ List a Resource</button>
      </div>

      {tab === 'available' && (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {busy && <div style={{ color:'#64748B', fontSize:13 }}>Loading…</div>}
          {!busy && allResources.filter(r=>r.listing_type==='offering').length === 0 && <Empty icon="📦" msg="No resources currently available." />}
          {allResources.filter(r=>r.listing_type==='offering').map(r => (
            <div key={r.id} style={{ ...S.card, display:'flex', gap:14, alignItems:'center' }}>
              <div style={{ width:44, height:44, borderRadius:10, background:'#F0FDF4', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>{resIcon[r.resource_type]||'📦'}</div>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:3 }}>
                  <span style={{ fontSize:13, fontWeight:700, color:'#0B1E3D' }}>{r.resource_type}</span>
                  <Pill col="green">Available</Pill>
                </div>
                <div style={{ fontSize:12, color:'#64748B', marginBottom:4 }}>
                  {r.org_name} · {r.location||'—'} · Qty: {r.qty} · {r.availability||'—'}
                </div>
                {r.sector && <Pill col="blue">{r.sector}</Pill>}
              </div>
              <div style={{ display:'flex', gap:6 }}>
                <button style={S.btnSmPrimary} onClick={() => { setReqForm({ qty_needed:1, required_dates:'', message:'' }); setModal({ type:'request', res: r }); }}>Request Resource</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'requested' && (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {busy && <div style={{ color:'#64748B', fontSize:13 }}>Loading…</div>}
          {!busy && allResources.filter(r=>r.listing_type==='requesting').length === 0 && <Empty icon="📦" msg="No resource requests at this time." />}
          {allResources.filter(r=>r.listing_type==='requesting').map(r => (
            <div key={r.id} style={{ ...S.card, display:'flex', gap:14, alignItems:'center' }}>
              <div style={{ width:44, height:44, borderRadius:10, background:'#FEF3C7', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>{resIcon[r.resource_type]||'📦'}</div>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:3 }}>
                  <span style={{ fontSize:13, fontWeight:700, color:'#0B1E3D' }}>{r.org_name} needs {r.resource_type}</span>
                  <Pill col="amber">Requested</Pill>
                </div>
                <div style={{ fontSize:12, color:'#64748B', marginBottom:4 }}>{r.location||'—'} · Qty: {r.qty} · {r.availability||'—'}</div>
                {r.sector && <Pill col="blue">{r.sector}</Pill>}
              </div>
              <button style={S.btnSmPrimary} onClick={() => { setReqForm({ qty_needed:1, required_dates:'', message:'' }); setModal({ type:'request', res: r }); }}>Offer Resource</button>
            </div>
          ))}
        </div>
      )}

      {tab === 'mine' && (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {busy && <div style={{ color:'#64748B', fontSize:13 }}>Loading…</div>}
          {!busy && myResources.length === 0 && <Empty icon="📦" msg="You haven't listed any resources yet. Click 'List a Resource' to get started." />}
          {myResources.map(r => (
            <div key={r.id} style={{ ...S.card, display:'flex', gap:14, alignItems:'center' }}>
              <div style={{ width:44, height:44, borderRadius:10, background:'#F0FDF4', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>{resIcon[r.resource_type]||'📦'}</div>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:3 }}>
                  <span style={{ fontSize:13, fontWeight:700, color:'#0B1E3D' }}>{r.resource_type}</span>
                  <Pill col={r.listing_type==='offering' ? 'green' : 'amber'}>{r.listing_type==='offering' ? 'Offering' : 'Requesting'}</Pill>
                </div>
                <div style={{ fontSize:12, color:'#64748B', marginBottom:4 }}>{r.location||'—'} · Qty: {r.qty} · {r.availability||'—'}</div>
                {r.sector && <Pill col="blue">{r.sector}</Pill>}
              </div>
              <button style={S.btnSmDanger} onClick={() => deleteResource(r.id)}>Remove</button>
            </div>
          ))}
        </div>
      )}

      {modal === 'list' && (
        <Modal title="List a Resource" onClose={() => setModal(null)} wide>
          <div style={S.fGrid(2)}>
            <div style={S.fGroup}><label style={S.label}>Resource type *</label>
              <select style={S.select} value={form.type||''} onChange={f('type')}>
                <option value="">Select</option>{RESOURCE_TYPES.map(r=><option key={r}>{r}</option>)}
              </select>
            </div>
            <div style={S.fGroup}><label style={S.label}>Quantity available</label><input style={S.input} type="number" value={form.qty||''} onChange={f('qty')} /></div>
            <div style={S.fGroup}><label style={S.label}>Location</label><input style={S.input} value={form.location||''} onChange={f('location')} placeholder="City, State" /></div>
            <div style={S.fGroup}><label style={S.label}>Availability period</label><input style={S.input} value={form.availability||''} onChange={f('availability')} placeholder="e.g. Aug–Oct 2026" /></div>
            <div style={S.fGroup}><label style={S.label}>Sector</label>
              <select style={S.select} value={form.sector||''} onChange={f('sector')}>
                <option value="">Select</option>{SECTORS_COL.map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
            <div style={S.fGroup}><label style={S.label}>Listing type</label>
              <select style={S.select} value={form.listing||''} onChange={f('listing')}>
                <option value="">Select</option><option>Offering (I have this resource)</option><option>Requesting (I need this resource)</option>
              </select>
            </div>
            <div style={{ ...S.fGroup, gridColumn:'1/-1' }}><label style={S.label}>Additional details</label>
              <textarea style={S.textarea} value={form.details||''} onChange={f('details')} placeholder="Capacity, specifications, terms of sharing, contact details…" />
            </div>
          </div>
          <div style={S.btnRow}>
            <button style={S.btn} onClick={() => setModal(null)}>Cancel</button>
            <button style={S.btnPrimary} disabled={saving} onClick={listResource}>{saving ? 'Listing…' : 'List Resource'}</button>
          </div>
        </Modal>
      )}

      {modal && modal.type === 'request' && (
        <Modal title={`Request: ${modal.res.resource_type}`} onClose={() => setModal(null)}>
          <div style={S.alert('info')}>ℹ️ Requesting <strong>{modal.res.resource_type}</strong> from <strong>{modal.res.org_name}</strong> ({modal.res.location||'—'}).</div>
          <div style={{ ...S.fGroup, margin:'12px 0' }}><label style={S.label}>Quantity needed</label>
            <input style={S.input} type="number" value={reqForm.qty_needed} onChange={e => setReqForm(p=>({...p, qty_needed:e.target.value}))} /></div>
          <div style={{ ...S.fGroup, marginBottom:12 }}><label style={S.label}>Required dates</label>
            <input style={S.input} value={reqForm.required_dates} onChange={e => setReqForm(p=>({...p, required_dates:e.target.value}))} placeholder="e.g. 1 Aug – 30 Sep 2026" /></div>
          <div style={{ ...S.fGroup, marginBottom:12 }}><label style={S.label}>Message</label>
            <textarea style={S.textarea} value={reqForm.message} onChange={e => setReqForm(p=>({...p, message:e.target.value}))} placeholder="Explain how you'll use the resource and your project context…" />
          </div>
          <div style={S.btnRow}>
            <button style={S.btn} onClick={() => setModal(null)}>Cancel</button>
            <button style={S.btnPrimary} disabled={saving} onClick={() => requestResource(modal.res.id)}>{saving ? 'Sending…' : 'Send Request'}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Invitations ───────────────────────────────────────────────────────────────
function CollabInvitations() {
  const [tab, setTab] = useState('received');
  const [modal, setModal] = useState(null);
  const [sendForm, setSendForm] = useState({ to_org_name:'', invitation_type:'', project_name:'', sector:'', state:'', message:'' });
  const [received, setReceived] = useState([]);
  const [sent, setSent] = useState([]);
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [discussMsg, setDiscussMsg] = useState('');

  const typeIcon = { 'Consortium Invitation':'🏗️','CSR Partnership Invitation':'🌱','Resource Sharing Request':'📦','Joint Project Invitation':'🤝','Employer Collaboration Request':'🏭','Partnership Invitation':'🔗' };
  const statusCol = { pending:'amber', accepted:'green', rejected:'red' };

  const loadInvitations = () => {
    setBusy(true);
    api.collabInvitations().then(data => {
      setReceived(data.received || []);
      setSent(data.sent || []);
    }).catch(()=>{}).finally(()=>setBusy(false));
  };
  useEffect(loadInvitations, []);

  const updateInvitation = async (id, status) => {
    try { await api.collabUpdateInvitation(id, status); loadInvitations(); }
    catch(e) { alert('Failed to update invitation.'); }
  };

  const sendInvitation = async () => {
    if (!sendForm.invitation_type || !sendForm.project_name) return alert('Invitation type and project name are required.');
    setSaving(true);
    try {
      await api.collabSendInvitation({ to_org_name: sendForm.to_org_name||null, invitation_type: sendForm.invitation_type, project_name: sendForm.project_name, sector: sendForm.sector||null, state: sendForm.state||null, message: sendForm.message||null });
      alert('Invitation sent!');
      setModal(null);
      setSendForm({ to_org_name:'', invitation_type:'', project_name:'', sector:'', state:'', message:'' });
      loadInvitations();
    } catch(e) { alert('Failed to send invitation.'); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:3 }}>
        <div style={S.pageTitle}>Invitations</div>
        <button style={S.btnPrimary} onClick={() => setModal('send')}>+ Send Invitation</button>
      </div>
      <div style={S.pageSub}>Send and receive collaboration invitations for projects, consortiums and partnerships</div>

      <div style={{ display:'flex', gap:8, marginBottom:14, borderBottom:'1px solid #E2E8F0', paddingBottom:10 }}>
        {[{ key:'received', label:`Received (${received.filter(r=>r.status==='pending').length} pending)` },{ key:'sent', label:'Sent' }].map(t => (
          <button key={t.key} style={{ padding:'6px 16px', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer', border:'none',
            background: tab===t.key ? '#0A2D6E':'#F1F5F9', color: tab===t.key ? '#fff':'#475569' }}
            onClick={() => setTab(t.key)}>{t.label}</button>
        ))}
      </div>

      {tab === 'received' && (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {busy && <div style={{ color:'#64748B', fontSize:13 }}>Loading…</div>}
          {!busy && received.length === 0 && <Empty icon="📩" msg="No invitations received yet." />}
          {received.map(inv => (
            <div key={inv.id} style={{ ...S.card, display:'flex', gap:14, alignItems:'center', borderLeft:`4px solid ${inv.status==='pending'?'#F59E0B':inv.status==='accepted'?'#10B981':'#EF4444'}` }}>
              <div style={{ width:44, height:44, borderRadius:10, background:'#F8FAFF', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>{typeIcon[inv.invitation_type]||'📩'}</div>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:3 }}>
                  <span style={{ fontSize:13, fontWeight:700, color:'#0B1E3D' }}>{inv.from_org_name}</span>
                  <Pill col="blue">{inv.invitation_type}</Pill>
                  <Pill col={statusCol[inv.status]||'gray'}>{inv.status}</Pill>
                  <span style={{ marginLeft:'auto', fontSize:11, color:'#94A3B8' }}>{fmtDate(inv.created_at)}</span>
                </div>
                <div style={{ fontSize:12, color:'#334155', marginBottom:2 }}>{inv.project_name}</div>
                <div style={{ fontSize:11, color:'#64748B' }}>{inv.sector||'—'} · {inv.state||'—'}</div>
              </div>
              {inv.status === 'pending' && (
                <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                  <button style={{ ...S.btnSmPrimary, background:'#10B981' }} onClick={() => updateInvitation(inv.id, 'accepted')}>Accept</button>
                  <button style={S.btnSmDanger} onClick={() => updateInvitation(inv.id, 'rejected')}>Reject</button>
                  <button style={S.btnSm} onClick={() => { setDiscussMsg(''); setModal({ type:'discuss', inv }); }}>Discuss</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'sent' && (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {busy && <div style={{ color:'#64748B', fontSize:13 }}>Loading…</div>}
          {!busy && sent.length === 0 && <Empty icon="📤" msg="No invitations sent yet." />}
          {sent.map(inv => (
            <div key={inv.id} style={{ ...S.card, display:'flex', gap:14, alignItems:'center', borderLeft:`4px solid ${inv.status==='pending'?'#F59E0B':'#10B981'}` }}>
              <div style={{ width:44, height:44, borderRadius:10, background:'#F8FAFF', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>{typeIcon[inv.invitation_type]||'📩'}</div>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:3 }}>
                  <span style={{ fontSize:13, fontWeight:700, color:'#0B1E3D' }}>To: {inv.to_org_name_resolved || inv.to_org_name}</span>
                  <Pill col="blue">{inv.invitation_type}</Pill>
                  <Pill col={statusCol[inv.status]||'gray'}>{inv.status}</Pill>
                  <span style={{ marginLeft:'auto', fontSize:11, color:'#94A3B8' }}>{fmtDate(inv.created_at)}</span>
                </div>
                <div style={{ fontSize:12, color:'#334155', marginBottom:2 }}>{inv.project_name}</div>
                <div style={{ fontSize:11, color:'#64748B' }}>{inv.sector||'—'} · {inv.state||'—'}</div>
              </div>
              {inv.status === 'pending' && <button style={S.btnSmDanger} onClick={() => updateInvitation(inv.id, 'withdrawn')}>Withdraw</button>}
            </div>
          ))}
        </div>
      )}

      {modal === 'send' && (
        <Modal title="Send Collaboration Invitation" onClose={() => setModal(null)} wide>
          <div style={S.fGrid(2)}>
            <div style={{ ...S.fGroup, gridColumn:'1/-1' }}><label style={S.label}>Organisation name *</label>
              <input style={S.input} value={sendForm.to_org_name} onChange={e => setSendForm(p=>({...p,to_org_name:e.target.value}))} placeholder="Name of organisation to invite" /></div>
            <div style={S.fGroup}><label style={S.label}>Invitation type *</label>
              <select style={S.select} value={sendForm.invitation_type} onChange={e => setSendForm(p=>({...p,invitation_type:e.target.value}))}>
                <option value="">Select</option>
                {['Consortium Invitation','Partnership Invitation','Resource Sharing Request','Joint Project Invitation','Employer Collaboration Request'].map(o=><option key={o}>{o}</option>)}
              </select>
            </div>
            <div style={S.fGroup}><label style={S.label}>Project / Initiative name *</label>
              <input style={S.input} value={sendForm.project_name} onChange={e => setSendForm(p=>({...p,project_name:e.target.value}))} placeholder="e.g. DDU-GKY Phase 3" /></div>
            <div style={S.fGroup}><label style={S.label}>Sector</label>
              <select style={S.select} value={sendForm.sector} onChange={e => setSendForm(p=>({...p,sector:e.target.value}))}>
                <option value="">Select</option>{SECTORS_COL.map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
            <div style={S.fGroup}><label style={S.label}>State</label>
              <select style={S.select} value={sendForm.state} onChange={e => setSendForm(p=>({...p,state:e.target.value}))}>
                <option value="">Select</option>{STATES_LIST.map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ ...S.fGroup, gridColumn:'1/-1' }}><label style={S.label}>Invitation message</label>
              <textarea style={S.textarea} value={sendForm.message} onChange={e => setSendForm(p=>({...p,message:e.target.value}))} placeholder="Describe the collaboration opportunity, your expectations and the mutual benefits…" />
            </div>
          </div>
          <div style={S.btnRow}>
            <button style={S.btn} onClick={() => setModal(null)}>Cancel</button>
            <button style={S.btnPrimary} disabled={saving} onClick={sendInvitation}>{saving ? 'Sending…' : 'Send Invitation'}</button>
          </div>
        </Modal>
      )}

      {modal && modal.type === 'discuss' && (
        <Modal title={`Discuss: ${modal.inv.project_name}`} onClose={() => setModal(null)}>
          <div style={S.alert('info')}>💬 Discussion with <strong>{modal.inv.from_org_name}</strong> regarding <strong>{modal.inv.project_name}</strong>.</div>
          <div style={{ ...S.fGroup, margin:'12px 0' }}><label style={S.label}>Your message</label>
            <textarea style={S.textarea} value={discussMsg} onChange={e => setDiscussMsg(e.target.value)} placeholder="Ask questions or share your thoughts before accepting or rejecting…" />
          </div>
          <div style={S.btnRow}>
            <button style={S.btn} onClick={() => setModal(null)}>Cancel</button>
            <button style={S.btnPrimary} onClick={() => { alert('For full discussion, use the messaging feature. Closing.'); setModal(null); }}>Close</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// NEW PANELS — Certifications, Placements, Analytics, AI Insights, Revenue, Marketing, Reviews
// ═══════════════════════════════════════════════════════════════════════════════

function PanelCertifications() {
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(true);
  useEffect(() => { api.vendorCertifications().then(d => setRows(d || [])).catch(() => {}).finally(() => setBusy(false)); }, []);
  const issued = rows.filter(r => r.certificate_issued).length;
  return (
    <div style={{ padding:20 }}>
      <div style={S.pageTitle}>Certifications</div>
      <div style={S.pageSub}>Students who have completed courses and are eligible for certificates.</div>
      <div style={{ display:'flex', gap:12, marginBottom:16 }}>
        {[['Total Students', rows.length, '#6366F1'], ['Certificates Issued', issued, '#22C55E'], ['In Progress', rows.length - issued, '#F59E0B']].map(([l, v, c]) => (
          <div key={l} style={{ ...S.stat, flex:1 }}>
            <div style={{ fontSize:11, color:'#64748B', marginBottom:4 }}>{l}</div>
            <div style={{ fontSize:24, fontWeight:800, color: c }}>{v}</div>
          </div>
        ))}
      </div>
      {busy ? <div style={{ color:'#94A3B8', padding:20 }}>Loading…</div> : (
        <div style={S.card}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead><tr>
              {['Student','Course','Batch','NSQF Level','Status','Certificate'].map(h => <th key={h} style={S.th}>{h}</th>)}
            </tr></thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={6} style={{ ...S.td, color:'#94A3B8', textAlign:'center', padding:24 }}>No students enrolled yet.</td></tr>}
              {rows.map(r => (
                <tr key={r.id}>
                  <td style={S.td}><div style={{ fontWeight:600 }}>{r.name}</div><div style={{ fontSize:11, color:'#94A3B8' }}>{r.email}</div></td>
                  <td style={S.td}>{r.course_title || '—'}</td>
                  <td style={S.td}>{r.batch_name || '—'}</td>
                  <td style={S.td}>{r.nsqf_level || '—'}</td>
                  <td style={S.td}><span style={{ padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:600, background: r.candidate_status === 'completed' ? '#DCFCE7' : '#FEF3C7', color: r.candidate_status === 'completed' ? '#16A34A' : '#D97706' }}>{r.candidate_status}</span></td>
                  <td style={S.td}>{r.certificate_issued ? <span style={{ color:'#16A34A', fontWeight:700 }}>✓ Issued</span> : <span style={{ color:'#94A3B8' }}>Pending</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function PanelPlacements() {
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(true);
  useEffect(() => { api.vendorPlacements().then(d => setRows(d || [])).catch(() => {}).finally(() => setBusy(false)); }, []);
  const placed = rows.filter(r => r.placement_status === 'placed' || r.placement_status_detail === 'placed' || r.placement_status_detail === 'joined').length;
  return (
    <div style={{ padding:20 }}>
      <div style={S.pageTitle}>Placements</div>
      <div style={S.pageSub}>Placement outcomes for your enrolled students.</div>
      <div style={{ display:'flex', gap:12, marginBottom:16 }}>
        {[['Total Students', rows.length, '#6366F1'], ['Placed / Joined', placed, '#22C55E'], ['Placement Rate', rows.length ? Math.round(placed/rows.length*100)+'%' : '0%', '#F59E0B']].map(([l, v, c]) => (
          <div key={l} style={{ ...S.stat, flex:1 }}>
            <div style={{ fontSize:11, color:'#64748B', marginBottom:4 }}>{l}</div>
            <div style={{ fontSize:24, fontWeight:800, color: c }}>{v}</div>
          </div>
        ))}
      </div>
      {busy ? <div style={{ color:'#94A3B8', padding:20 }}>Loading…</div> : (
        <div style={S.card}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead><tr>
              {['Student','Course','Job Title','Company','CTC (LPA)','Agency','Status'].map(h => <th key={h} style={S.th}>{h}</th>)}
            </tr></thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={7} style={{ ...S.td, color:'#94A3B8', textAlign:'center', padding:24 }}>No placement data yet.</td></tr>}
              {rows.map(r => (
                <tr key={r.id}>
                  <td style={S.td}><div style={{ fontWeight:600 }}>{r.name}</div><div style={{ fontSize:11, color:'#94A3B8' }}>{r.email}</div></td>
                  <td style={S.td}>{r.course_title || '—'}</td>
                  <td style={S.td}>{r.job_title || '—'}</td>
                  <td style={S.td}>{r.company || '—'}</td>
                  <td style={S.td}>{r.ctc ? `₹${r.ctc}` : '—'}</td>
                  <td style={S.td}>{r.agency_name || '—'}</td>
                  <td style={S.td}><span style={{ padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:600, background: r.placement_status_detail === 'joined' ? '#DCFCE7' : r.placement_status_detail === 'placed' ? '#DBEAFE' : '#F1F5F9', color: r.placement_status_detail === 'joined' ? '#16A34A' : r.placement_status_detail === 'placed' ? '#1D4ED8' : '#64748B' }}>{r.placement_status_detail || r.placement_status || 'Not Placed'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function PanelAnalytics() {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(true);
  useEffect(() => { api.vendorAnalytics().then(setData).catch(() => {}).finally(() => setBusy(false)); }, []);
  if (busy) return <div style={{ padding:20, color:'#94A3B8' }}>Loading analytics…</div>;
  const d = data || {};
  const statCards = [
    { l:'Total Students', v: d.total_students ?? 0, c:'#6366F1' },
    { l:'Active Students', v: d.active_students ?? 0, c:'#22C55E' },
    { l:'Completed', v: d.completed ?? 0, c:'#F59E0B' },
    { l:'Placed', v: d.placed ?? 0, c:'#10B981' },
    { l:'Active Courses', v: d.total_courses ?? 0, c:'#8B5CF6' },
    { l:'Active Batches', v: d.active_batches ?? 0, c:'#EC4899' },
    { l:'Trainers', v: d.total_trainers ?? 0, c:'#0EA5E9' },
    { l:'Centres', v: d.total_centres ?? 0, c:'#F97316' },
  ];
  return (
    <div style={{ padding:20 }}>
      <div style={S.pageTitle}>Analytics</div>
      <div style={S.pageSub}>Key performance metrics across your training operations.</div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:16 }}>
        {statCards.map(s => (
          <div key={s.l} style={{ ...S.stat }}>
            <div style={{ fontSize:11, color:'#64748B', marginBottom:4 }}>{s.l}</div>
            <div style={{ fontSize:26, fontWeight:800, color: s.c }}>{s.v}</div>
          </div>
        ))}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <div style={S.card}>
          <div style={S.cardTitle}>Placement & Completion Rates</div>
          {[['Placement Rate', d.placement_rate ?? 0, '#22C55E'], ['Completion Rate', d.completion_rate ?? 0, '#6366F1']].map(([l, v, c]) => (
            <div key={l} style={{ marginBottom:12 }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:4 }}><span>{l}</span><span style={{ fontWeight:700, color: c }}>{v}%</span></div>
              <div style={{ height:8, background:'#F1F5F9', borderRadius:4 }}><div style={{ width:`${v}%`, height:'100%', background: c, borderRadius:4 }} /></div>
            </div>
          ))}
        </div>
        <div style={S.card}>
          <div style={S.cardTitle}>Top Sectors</div>
          {(d.sector_breakdown || []).length === 0 && <div style={{ color:'#94A3B8', fontSize:13 }}>No sector data yet.</div>}
          {(d.sector_breakdown || []).map((s, i) => (
            <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid #F1F5F9', fontSize:13 }}>
              <span>{s.sector}</span><span style={{ fontWeight:700, color:'#6366F1' }}>{s.c} students</span>
            </div>
          ))}
        </div>
        <div style={{ ...S.card, gridColumn:'1/-1' }}>
          <div style={S.cardTitle}>Monthly Enrollments</div>
          {(d.monthly_enrollments || []).length === 0 ? <div style={{ color:'#94A3B8', fontSize:13 }}>No enrollment history yet.</div> : (
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead><tr>{['Month','Enrollments'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
              <tbody>{(d.monthly_enrollments || []).map((m, i) => <tr key={i}><td style={S.td}>{m.month}</td><td style={S.td}>{m.c}</td></tr>)}</tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function PanelAiInsights() {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(true);
  useEffect(() => { api.vendorAiInsights().then(setData).catch(() => {}).finally(() => setBusy(false)); }, []);
  if (busy) return <div style={{ padding:20, color:'#94A3B8' }}>Generating AI insights…</div>;
  const d = data || {};
  const typeStyle = { success:{ bg:'#DCFCE7', color:'#16A34A', icon:'✅' }, warning:{ bg:'#FEF3C7', color:'#D97706', icon:'⚠️' }, info:{ bg:'#DBEAFE', color:'#1D4ED8', icon:'💡' } };
  return (
    <div style={{ padding:20 }}>
      <div style={S.pageTitle}>AI Insights</div>
      <div style={S.pageSub}>AI-generated recommendations based on your real training data.</div>
      <div style={{ display:'flex', gap:12, marginBottom:16 }}>
        {[['Placement Rate', (d.stats?.placement_rate ?? 0)+'%', '#22C55E'], ['Completion Rate', (d.stats?.completion_rate ?? 0)+'%', '#6366F1'], ['Total Students', d.stats?.total ?? 0, '#F59E0B'], ['Placed', d.stats?.placed ?? 0, '#10B981']].map(([l, v, c]) => (
          <div key={l} style={{ ...S.stat, flex:1 }}>
            <div style={{ fontSize:11, color:'#64748B', marginBottom:4 }}>{l}</div>
            <div style={{ fontSize:24, fontWeight:800, color: c }}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {(d.insights || []).map((ins, i) => {
          const ts = typeStyle[ins.type] || typeStyle.info;
          return (
            <div key={i} style={{ ...S.card, display:'flex', alignItems:'flex-start', gap:14, background: ts.bg, border:`1px solid ${ts.color}33`, marginBottom:0 }}>
              <div style={{ fontSize:22, flexShrink:0 }}>{ts.icon}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, fontSize:14, color: ts.color, marginBottom:4 }}>{ins.title}</div>
                <div style={{ fontSize:13, color:'#334155' }}>{ins.detail}</div>
              </div>
              <span style={{ fontSize:11, color: ts.color, fontWeight:600, whiteSpace:'nowrap', flexShrink:0 }}>{ins.action} →</span>
            </div>
          );
        })}
        {(d.insights || []).length === 0 && <div style={{ color:'#94A3B8', padding:20, textAlign:'center' }}>Add students and courses to generate AI insights.</div>}
      </div>
    </div>
  );
}

function PanelRevenue() {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(true);
  useEffect(() => { api.vendorRevenue().then(setData).catch(() => {}).finally(() => setBusy(false)); }, []);
  if (busy) return <div style={{ padding:20, color:'#94A3B8' }}>Loading revenue data…</div>;
  const d = data || {};
  const fmt = v => v >= 10000000 ? `₹${(v/10000000).toFixed(2)} Cr` : v >= 100000 ? `₹${(v/100000).toFixed(1)} L` : `₹${(v||0).toLocaleString('en-IN')}`;
  return (
    <div style={{ padding:20 }}>
      <div style={S.pageTitle}>Revenue</div>
      <div style={S.pageSub}>Revenue derived from course fees across enrolled students.</div>
      <div style={{ display:'flex', gap:12, marginBottom:16 }}>
        {[['Total Revenue', fmt(d.total_revenue), '#22C55E'], ['Total Enrolled', d.total_enrolled ?? 0, '#6366F1'], ['Avg per Student', d.total_enrolled ? fmt(Math.round((d.total_revenue||0)/d.total_enrolled)) : '₹0', '#F59E0B']].map(([l, v, c]) => (
          <div key={l} style={{ ...S.stat, flex:1 }}>
            <div style={{ fontSize:11, color:'#64748B', marginBottom:4 }}>{l}</div>
            <div style={{ fontSize:22, fontWeight:800, color: c }}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1.5fr 1fr', gap:12 }}>
        <div style={S.card}>
          <div style={S.cardTitle}>Revenue by Course</div>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead><tr>{['Course','Fee Type','Fee (₹)','Enrolled','Revenue'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
            <tbody>
              {(d.courses || []).length === 0 && <tr><td colSpan={5} style={{ ...S.td, color:'#94A3B8', textAlign:'center' }}>No courses with fee data.</td></tr>}
              {(d.courses || []).map((c, i) => (
                <tr key={i}>
                  <td style={S.td}>{c.title}</td>
                  <td style={S.td}><span style={{ fontSize:11, padding:'2px 8px', borderRadius:20, background: c.fee_type === 'free' ? '#DCFCE7':'#DBEAFE', color: c.fee_type === 'free' ? '#16A34A':'#1D4ED8' }}>{c.fee_type}</span></td>
                  <td style={S.td}>{c.fee_amount ? `₹${Number(c.fee_amount).toLocaleString('en-IN')}` : '—'}</td>
                  <td style={S.td}>{c.enrolled_count}</td>
                  <td style={{ ...S.td, fontWeight:700, color:'#22C55E' }}>{fmt(c.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={S.card}>
          <div style={S.cardTitle}>Monthly Revenue Trend</div>
          {(d.monthly || []).length === 0 && <div style={{ color:'#94A3B8', fontSize:13 }}>No monthly data yet.</div>}
          {(d.monthly || []).map((m, i) => (
            <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid #F1F5F9', fontSize:13 }}>
              <span>{m.month}</span><span style={{ fontWeight:700, color:'#22C55E' }}>{fmt(m.revenue)}</span><span style={{ color:'#94A3B8' }}>{m.count} enrolments</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PanelMarketing() {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(true);
  useEffect(() => { api.vendorMarketing().then(setData).catch(() => {}).finally(() => setBusy(false)); }, []);
  if (busy) return <div style={{ padding:20, color:'#94A3B8' }}>Loading…</div>;
  const d = data || {};
  const reach = d.reach || {};
  return (
    <div style={{ padding:20 }}>
      <div style={S.pageTitle}>Marketing</div>
      <div style={S.pageSub}>Your training programme reach and visibility metrics.</div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:16 }}>
        {[['Students Reached', reach.students ?? 0, '#6366F1'], ['Active Courses', reach.courses ?? 0, '#22C55E'], ['Training Centres', reach.centres ?? 0, '#F59E0B'], ['Batches Run', reach.batches ?? 0, '#EC4899']].map(([l, v, c]) => (
          <div key={l} style={{ ...S.stat }}>
            <div style={{ fontSize:11, color:'#64748B', marginBottom:4 }}>{l}</div>
            <div style={{ fontSize:26, fontWeight:800, color: c }}>{v}</div>
          </div>
        ))}
      </div>
      <div style={S.card}>
        <div style={S.cardTitle}>Active Courses — Promote These</div>
        {(d.top_courses || []).length === 0 && <div style={{ color:'#94A3B8', fontSize:13 }}>No active courses yet. Add courses to market your programmes.</div>}
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead><tr>{['Course Title','Sector','NSQF Level'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>
            {(d.top_courses || []).map((c, i) => (
              <tr key={i}>
                <td style={{ ...S.td, fontWeight:600 }}>{c.title}</td>
                <td style={S.td}>{c.sector || '—'}</td>
                <td style={S.td}>{c.nsqf_level || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PanelReviews() {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(true);
  useEffect(() => { api.vendorReviews().then(setData).catch(() => {}).finally(() => setBusy(false)); }, []);
  if (busy) return <div style={{ padding:20, color:'#94A3B8' }}>Loading…</div>;
  const d = data || {};
  const summary = d.summary || {};
  const grievances = d.grievances || [];
  const statusColor = { open:'#D97706', resolved:'#16A34A', 'in-progress':'#1D4ED8' };
  const statusBg = { open:'#FEF3C7', resolved:'#DCFCE7', 'in-progress':'#DBEAFE' };
  return (
    <div style={{ padding:20 }}>
      <div style={S.pageTitle}>Reviews & Feedback</div>
      <div style={S.pageSub}>Feedback and support tickets submitted by your students and staff.</div>
      <div style={{ display:'flex', gap:12, marginBottom:16 }}>
        {[['Total Tickets', summary.total ?? 0, '#6366F1'], ['Open', summary.open ?? 0, '#F59E0B'], ['Resolved', summary.resolved ?? 0, '#22C55E']].map(([l, v, c]) => (
          <div key={l} style={{ ...S.stat, flex:1 }}>
            <div style={{ fontSize:11, color:'#64748B', marginBottom:4 }}>{l}</div>
            <div style={{ fontSize:26, fontWeight:800, color: c }}>{v}</div>
          </div>
        ))}
      </div>
      <div style={S.card}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead><tr>{['Subject','Category','Priority','Submitted By','Date','Status'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>
            {grievances.length === 0 && <tr><td colSpan={6} style={{ ...S.td, color:'#94A3B8', textAlign:'center', padding:24 }}>No feedback tickets yet.</td></tr>}
            {grievances.map(g => (
              <tr key={g.id}>
                <td style={{ ...S.td, fontWeight:600 }}>{g.subject}</td>
                <td style={S.td}>{g.category || '—'}</td>
                <td style={S.td}><span style={{ fontSize:11, padding:'2px 8px', borderRadius:20, background: g.priority === 'high' ? '#FEE2E2':'#F1F5F9', color: g.priority === 'high' ? '#DC2626':'#64748B' }}>{g.priority || 'normal'}</span></td>
                <td style={S.td}>{g.submitted_by || '—'}</td>
                <td style={S.td}>{g.created_at ? new Date(g.created_at).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '—'}</td>
                <td style={S.td}><span style={{ padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:600, background: statusBg[g.status] || '#F1F5F9', color: statusColor[g.status] || '#64748B' }}>{g.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SIDEBAR DEFINITION
// ═══════════════════════════════════════════════════════════════════════════════

const NAV = [
  { section: 'Main' },
  { key:'dashboard', icon:'🏠', label:'Dashboard' },
  { key:'onboarding', icon:'🏢', label:'Organization Profile' },

  { section: 'Training' },
  { icon:'📍', label:'Training Centres', children:[
    { key:'centres', label:'Centre list' },
    { key:'centres-add', label:'Add centre' },
  ]},
  { icon:'👨‍🏫', label:'Trainers & Faculty', children:[
    { key:'trainers', label:'Trainer list' },
    { key:'trainers-add', label:'Add trainer' },
  ]},
  { icon:'📚', label:'Courses & Curriculum', children:[
    { key:'courses', label:'Course catalogue' },
    { key:'courses-add', label:'Add course' },
  ]},
  { icon:'📅', label:'Batch Management', children:[
    { key:'batches', label:'All batches' },
    { key:'batches-add', label:'Create batch' },
  ]},

  { section: 'Candidates' },
  { icon:'👤', label:'Candidate Management', children:[
    { key:'candidates', label:'All candidates' },
    { key:'candidates-add', label:'Enrol candidate' },
  ]},

  { section: 'Assessment' },
  { icon:'📋', label:'Assessments', children:[
    { key:'assess', label:'All assessments' },
    { key:'assess-add', label:'Schedule assessment' },
  ]},
  { key:'certifications', icon:'🛡️', label:'Certifications' },
  { key:'placements-tv', icon:'💼', label:'Placements' },

  { section: 'Insights' },
  { key:'analytics', icon:'📈', label:'Analytics' },
  { key:'ai-insights', icon:'🤖', label:'AI Insights' },
  { key:'revenue', icon:'💰', label:'Revenue' },
  { key:'marketing', icon:'📣', label:'Marketing' },
  { key:'reviews', icon:'⭐', label:'Reviews & Feedback' },

  { section: 'Collaboration' },
  { icon:'🤝', label:'Collaboration', children:[
    { key:'collab-consortium', label:'Consortium Builder' },
    { key:'collab-partnership', label:'Partnership Requests' },
    { key:'collab-resources', label:'Resource Sharing' },
    { key:'collab-invitations', label:'Invitations' },
  ]},

  { section: 'Compliance' },
  { key:'reports', icon:'📊', label:'Reports & MIS' },
  { key:'docs', icon:'📁', label:'Documents' },
  { key:'grievance', icon:'🎫', label:'Grievance & Support' },

  { section: '' },
  { key:'settings', icon:'⚙️', label:'Account Preferences' },
];

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PORTAL SHELL
// ═══════════════════════════════════════════════════════════════════════════════
// Flat list of all navigable pages for search
const SEARCH_INDEX = NAV.flatMap(item => {
  if (item.section !== undefined) return [];
  if (item.children) return item.children.map(c => ({ key: c.key, label: c.label, parent: item.label, icon: item.icon }));
  return [{ key: item.key, label: item.label, parent: null, icon: item.icon }];
});

export default function TrainingVendorPortal() {
  const { user, logout, refresh } = useAuth();
  const routerNavigate = useNavigate();
  const [activeKey, setActiveKey] = useState('dashboard');
  const [openMenus, setOpenMenus] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [menuPerms, setMenuPerms] = useState({});
  const [avatarTipOpen, setAvatarTipOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const navigate = (key) => { setActiveKey(key); setSearchQuery(''); setSearchFocused(false); };

  useEffect(() => {
    api.getRolePermissions().then(all => setMenuPerms(all['training_vendor'] || {})).catch(() => {});
  }, []);
  const PERM_LOCKED = new Set(['dashboard','org-profile','settings','onboarding']);
  const allowed = k => !k || PERM_LOCKED.has(k) || menuPerms[k] !== false;
  useEffect(() => { if (Object.keys(menuPerms).length && !allowed(activeKey)) setActiveKey('dashboard'); }, [menuPerms]); // eslint-disable-line

  const searchResults = searchQuery.trim().length > 0
    ? SEARCH_INDEX.filter(item =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.parent || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const toggleMenu = (label) => setOpenMenus(p => ({ ...p, [label]: !p[label] }));

  const renderPanel = () => {
    if (activeKey === 'dashboard') return <Dashboard user={user} onNav={navigate} />;
    if (activeKey === 'org-profile') return <OrgProfile user={user} onUserUpdate={refresh} />;
    if (activeKey === 'centres' || activeKey === 'centres-add') return <Centres activeSection={activeKey} onNav={navigate} />;
    if (activeKey === 'trainers' || activeKey === 'trainers-add') return <TrainersList activeSection={activeKey} onNav={navigate} />;
    if (activeKey === 'courses' || activeKey === 'courses-add') return <CoursesList />;
    if (activeKey === 'batches' || activeKey === 'batches-add') return <Batches />;
    if (activeKey === 'candidates' || activeKey === 'candidates-add') return <Candidates />;
    if (activeKey === 'assess' || activeKey === 'assess-add') return <Assessments />;
    if (activeKey === 'collab-consortium') return <CollabConsortium />;
    if (activeKey === 'collab-partnership') return <CollabPartnership />;
    if (activeKey === 'collab-resources') return <CollabResourceSharing />;
    if (activeKey === 'collab-invitations') return <CollabInvitations />;
    if (activeKey === 'reports') return <Reports />;
    if (activeKey === 'docs') return <Documents />;
    if (activeKey === 'grievance') return <Grievances />;
    if (activeKey === 'onboarding') return <TrainingPartnerOnboarding standalone={false} onDone={() => setActiveKey('dashboard')} />;
    if (activeKey === 'settings') return <AccountPreferences onLogout={() => { logout(); window.location.href = '/'; }} />;
    if (activeKey === 'certifications') return <PanelCertifications />;
    if (activeKey === 'placements-tv') return <PanelPlacements />;
    if (activeKey === 'analytics') return <PanelAnalytics />;
    if (activeKey === 'ai-insights') return <PanelAiInsights />;
    if (activeKey === 'revenue') return <PanelRevenue />;
    if (activeKey === 'marketing') return <PanelMarketing />;
    if (activeKey === 'reviews') return <PanelReviews />;
    return <Dashboard user={user} onNav={navigate} />;
  };

  const breadcrumb = (() => {
    for (const item of NAV) {
      if (item.key === activeKey) return item.label;
      if (item.children) {
        const ch = item.children.find(c => c.key === activeKey);
        if (ch) return `${item.label} → ${ch.label}`;
      }
    }
    return 'Dashboard';
  })();

  return (
    <div style={S.shell}>
      {/* SIDEBAR */}
      <nav style={S.sidebar}>
        <div style={S.sbLogo}>
          <div style={{ width:32, height:32, borderRadius:'50%', border:'2px solid #e0e8f4', background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', flexShrink:0 }}><img src="/logo.png" alt="Skills n Jobs" style={{ width:24, height:24, objectFit:'contain' }} /></div>
          <div style={{ minWidth:0 }}>
            <div style={{ color:'#fff', fontSize:10, fontWeight:700, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.org_name || 'My Organisation'}</div>
            <div style={{ color:'rgba(255,255,255,.5)', fontSize:9 }}>Training Partner</div>
          </div>
        </div>

        <div style={S.sbScroll}>
          {NAV.map((item, i) => {
            if (item.section !== undefined) {
              return item.section ? <div key={i} style={S.sbSection}>{item.section}</div> : <div key={i} style={{ height:6 }} />;
            }
            if (item.children) {
              const visChildren = item.children.filter(c => allowed(c.key));
              if (!visChildren.length) return null;
              const isOpen = openMenus[item.label];
              const anyActive = visChildren.some(c => c.key === activeKey);
              return (
                <div key={item.label}>
                  <div style={S.sbItem(anyActive)} onClick={() => toggleMenu(item.label)}>
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                    <span style={S.sbChev(isOpen)}>▾</span>
                  </div>
                  {isOpen && visChildren.map(ch => (
                    <div key={ch.key} style={S.sbChild(ch.key === activeKey)} onClick={() => navigate(ch.key)}>
                      <span style={{ width:5, height:5, borderRadius:'50%', background:'currentColor', flexShrink:0 }} />
                      {ch.label}
                    </div>
                  ))}
                </div>
              );
            }
            if (item.key === 'onboarding') {
              const isActive = item.key === activeKey;
              return (
                <div key={item.key} onClick={() => navigate(item.key)}
                  style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 9px', cursor:'pointer', borderRadius:6, margin:'4px 4px',
                    background: isActive ? 'rgba(255,255,255,.22)' : 'transparent',
                    border: isActive ? '1.5px solid rgba(255,255,255,.3)' : '1.5px solid transparent',
                    color:'#fff', fontSize:11, fontWeight: isActive ? 700 : 600,
                    boxShadow: isActive ? '0 2px 8px rgba(0,0,0,.18)' : 'none', transition:'background .15s' }}>
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
              );
            }
            if (!allowed(item.key)) return null;
            return (
              <div key={item.key} style={S.sbItem(item.key === activeKey)} onClick={() => navigate(item.key)}>
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </div>
            );
          })}
        </div>

        {/* AI Vendor Score widget */}
        <div style={{ margin:'6px 6px 4px', borderRadius:9, padding:'10px 10px 8px',
          background:'linear-gradient(135deg,#0D1B3E,#162550)',
          border:'1px solid rgba(99,102,241,0.3)', flexShrink:0 }}>
          <div style={{ fontSize:9, fontWeight:700, color:'rgba(255,255,255,.5)', letterSpacing:'.6px', textTransform:'uppercase', marginBottom:6 }}>AI Vendor Score</div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ position:'relative', flexShrink:0 }}>
              <svg width="56" height="34" viewBox="0 0 56 34">
                <path d="M4,32 A24,24 0 0,1 52,32" fill="none" stroke="#1E2D4A" strokeWidth="5" strokeLinecap="round"/>
                <path d="M4,32 A24,24 0 0,1 52,32" fill="none" stroke="url(#scoreGrad)" strokeWidth="5" strokeLinecap="round"
                  strokeDasharray="75.4" strokeDashoffset="7.5"/>
                <defs>
                  <linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#6366F1"/>
                    <stop offset="60%" stopColor="#A78BFA"/>
                    <stop offset="100%" stopColor="#F59E0B"/>
                  </linearGradient>
                </defs>
              </svg>
              <div style={{ position:'absolute', bottom:0, left:0, right:0, textAlign:'center', fontSize:14, fontWeight:800, color:'#fff', lineHeight:1 }}>94</div>
            </div>
            <div>
              <div style={{ fontSize:9, color:'rgba(255,255,255,.45)', marginBottom:1 }}>/100</div>
              <div style={{ fontSize:9, fontWeight:700, color:'#22C55E' }}>✦ Excellent</div>
              <div style={{ fontSize:8, color:'rgba(255,255,255,.4)', marginTop:1 }}>Top 8% of vendors</div>
            </div>
          </div>
        </div>

        {/* Go Premium banner */}
        <div style={{ margin:'6px 6px 4px', borderRadius:9, padding:'6px 9px',
          background:'linear-gradient(135deg,#1a1060,#3d2db0)',
          border:'1px solid rgba(255,255,255,0.1)',
          display:'flex', alignItems:'center', gap:6, flexShrink:0, cursor:'pointer' }}
          onClick={() => navigate('onboarding')}>
          <span style={{ fontSize:12, flexShrink:0 }}>👑</span>
          <span style={{ fontWeight:700, fontSize:10, whiteSpace:'nowrap',
            background:'linear-gradient(90deg,#FFD700,#FFA500)', WebkitBackgroundClip:'text',
            WebkitTextFillColor:'transparent', backgroundClip:'text', flex:1 }}>Go Premium</span>
          <span style={{ flexShrink:0, padding:'3px 8px', borderRadius:20, border:'none', cursor:'pointer',
            background:'linear-gradient(90deg,#7B5CF6,#9B6FFF)',
            color:'#fff', fontWeight:700, fontSize:9, whiteSpace:'nowrap' }}>Upgrade</span>
        </div>

      </nav>

      {/* MAIN */}
      <div style={S.main}>
        <div style={{ ...S.topbar, position:'relative' }}>
          <span style={{ fontSize:12, color:'#94A3B8' }}>{breadcrumb}</span>
          <div style={{ flex:1, maxWidth:380, margin:'0 16px', position:'relative' }}>
            <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', fontSize:14, color:'#94A3B8', pointerEvents:'none' }}>🔍</span>
            <input
              type="search"
              placeholder="Search courses, batches, learners…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
              style={{ width:'100%', padding:'7px 12px 7px 32px', border:'1.5px solid #E2E8F0', borderRadius:8, fontSize:13, color:'#1A2B4A', outline:'none', background:'#F8FAFC', boxSizing:'border-box' }}
            />
            {searchFocused && searchResults.length > 0 && (
              <div style={{ position:'absolute', top:'calc(100% + 4px)', left:0, right:0, background:'#fff', border:'1.5px solid #E2E8F0', borderRadius:8, boxShadow:'0 8px 24px rgba(0,0,0,0.12)', zIndex:1000, overflow:'hidden' }}>
                {searchResults.map(item => (
                  <div
                    key={item.key}
                    onMouseDown={() => navigate(item.key)}
                    style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 14px', cursor:'pointer', borderBottom:'1px solid #F1F5F9' }}
                    onMouseEnter={e => e.currentTarget.style.background='#F8FAFC'}
                    onMouseLeave={e => e.currentTarget.style.background='#fff'}
                  >
                    <span style={{ fontSize:16 }}>{item.icon}</span>
                    <div>
                      <div style={{ fontSize:13, fontWeight:600, color:'#0B1E3D' }}>{item.label}</div>
                      {item.parent && <div style={{ fontSize:11, color:'#94A3B8' }}>{item.parent}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {searchFocused && searchQuery.trim().length > 0 && searchResults.length === 0 && (
              <div style={{ position:'absolute', top:'calc(100% + 4px)', left:0, right:0, background:'#fff', border:'1.5px solid #E2E8F0', borderRadius:8, boxShadow:'0 8px 24px rgba(0,0,0,0.12)', zIndex:1000, padding:'12px 14px', fontSize:13, color:'#94A3B8' }}>
                No results for "{searchQuery}"
              </div>
            )}
          </div>
          <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:10 }}>
            {/* Notification bell */}
            <div style={{ position:'relative' }}>
              <button onClick={() => setNotifOpen(p => !p)}
                style={{ position:'relative', display:'flex', alignItems:'center', justifyContent:'center', width:38, height:38, borderRadius:'50%', border:'1px solid #E2E8F0', background:'#F8FAFC', color:'#64748B', fontSize:17, cursor:'pointer', flexShrink:0 }}>
                🔔
                <span style={{ position:'absolute', top:6, right:6, width:8, height:8, borderRadius:'50%', background:'#EF4444', border:'2px solid #fff' }} />
              </button>
              {notifOpen && (
                <div style={{ position:'absolute', top:'calc(100% + 8px)', right:0, zIndex:600, background:'#fff', border:'1px solid #E2E8F0', borderRadius:12, boxShadow:'0 8px 24px rgba(0,0,0,.13)', width:300 }}>
                  <div style={{ padding:'12px 16px', borderBottom:'1px solid #E2E8F0', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <span style={{ fontSize:13, fontWeight:700, color:'#0B1E3D' }}>Notifications</span>
                    <span style={{ fontSize:11, color:'#1A56C4', cursor:'pointer' }} onClick={() => setNotifOpen(false)}>Mark all read</span>
                  </div>
                  {[
                    { icon:'📋', title:'New assessment scheduled', sub:'Batch AIML-25A · Today 10:00 AM', dot:true },
                    { icon:'👤', title:'5 new candidates enrolled', sub:'Full Stack Batch 2025-A · Yesterday', dot:true },
                    { icon:'🏆', title:'Placement rate improved', sub:'Now at 91% · +8.7% this month', dot:false },
                    { icon:'📄', title:'Document expiring soon', sub:'Fire Safety NOC · expires Mar 2026', dot:false },
                  ].map((n, i) => (
                    <div key={i} onClick={() => setNotifOpen(false)}
                      style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'10px 16px', borderBottom: i < 3 ? '1px solid #F1F5F9' : 'none', cursor:'pointer', background: n.dot ? '#F8FAFF' : '#fff' }}
                      onMouseEnter={e => e.currentTarget.style.background='#F1F5F9'}
                      onMouseLeave={e => e.currentTarget.style.background= n.dot ? '#F8FAFF' : '#fff'}>
                      <span style={{ fontSize:18, flexShrink:0 }}>{n.icon}</span>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:12, fontWeight:600, color:'#0B1E3D', display:'flex', alignItems:'center', gap:6 }}>
                          {n.title}
                          {n.dot && <span style={{ width:6, height:6, borderRadius:'50%', background:'#1A56C4', flexShrink:0 }} />}
                        </div>
                        <div style={{ fontSize:11, color:'#94A3B8', marginTop:2 }}>{n.sub}</div>
                      </div>
                    </div>
                  ))}
                  <div style={{ padding:'10px 16px', textAlign:'center' }}>
                    <span style={{ fontSize:12, color:'#1A56C4', cursor:'pointer', fontWeight:600 }}>View all notifications</span>
                  </div>
                </div>
              )}
            </div>
            {/* Avatar with hover tooltip */}
            <div style={{ position:'relative' }}
              onMouseEnter={() => setAvatarTipOpen(true)}
              onMouseLeave={() => setAvatarTipOpen(false)}>
              <div onClick={() => navigate('onboarding')} style={{ display:'flex', alignItems:'center', padding:5, borderRadius:'50%', background:'#F1F5F9', border:'1px solid #E2E8F0', cursor:'pointer' }}>
                <div style={{ width:36, height:36, borderRadius:'50%', background:'linear-gradient(135deg,#0A2D6E,#1A56C4)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:14, color:'#fff', border:'2px solid rgba(10,45,110,.3)', flexShrink:0 }}>
                  {(user?.org_name || user?.name || 'TP').slice(0,2).toUpperCase()}
                </div>
              </div>
              {avatarTipOpen && (
                <div style={{ position:'absolute', top:'calc(100% + 8px)', right:0, zIndex:500, background:'#fff', border:'1px solid #E2E8F0', borderRadius:12, padding:'12px 14px', minWidth:190, boxShadow:'0 8px 24px rgba(0,0,0,.13)', whiteSpace:'nowrap' }}>
                  <div style={{ fontSize:13, fontWeight:700, color:'#0B1E3D' }}>{user?.org_name || user?.name || 'Training Partner'}</div>
                  <div style={{ fontSize:11, color:'#94A3B8', marginTop:2 }}>ID: TP-{String(user?.id||'0').padStart(6,'0')}</div>
                  <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:8 }}>
                    <div style={{ flex:1, height:4, background:'#E2E8F0', borderRadius:4, overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${profilePct}%`, background:'linear-gradient(90deg,#0A2D6E,#1A56C4)', borderRadius:4 }} />
                    </div>
                    <span style={{ fontSize:10, fontWeight:700, color:'#1A56C4' }}>{profilePct}%</span>
                  </div>
                  <div style={{ fontSize:10, color:'#94A3B8', marginTop:4 }}>Profile completion</div>
                  <div style={{ marginTop:10, paddingTop:8, borderTop:'1px solid #E2E8F0' }}>
                    <button onClick={() => { setAvatarTipOpen(false); navigate('onboarding'); }} style={{ width:'100%', padding:'5px 0', background:'#0A2D6E', color:'#fff', border:'none', borderRadius:7, fontSize:11.5, fontWeight:600, cursor:'pointer' }}>View Profile →</button>
                  </div>
                </div>
              )}
            </div>
            {/* Sign out icon */}
            <button onClick={() => { logout(); routerNavigate('/'); }} title="Sign Out"
              style={{ display:'flex', alignItems:'center', justifyContent:'center', width:38, height:38, borderRadius:'50%', border:'none', background:'#1A56C4', color:'#fff', fontSize:18, cursor:'pointer', flexShrink:0 }}>⏻</button>
          </div>
        </div>
        <div style={S.content}>
          {renderPanel()}
        </div>
      </div>
    </div>
  );
}
