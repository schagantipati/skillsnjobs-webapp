import { validate as fieldValidate, UPPERCASE_FIELDS as UPPERCASE_TYPES } from '../utils/validators.js';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

/* ─── palette ─────────────────────────────────────────────────── */
const C = {
  navy:'#003366', blue:'#0057A8', bluePale:'#E8F0FB',
  teal:'#007B5E', tealPale:'#E6F4F1',
  green:'#28A745', greenPale:'#E8F5E9',
  gold:'#F4A900', goldPale:'#FEF8E7',
  red:'#DC2626', redPale:'#FEE2E2',
  purple:'#7C3AED', purplePale:'#EDE9FE',
  sidebar:'#1A56C4',
  surface:'#F4F6F9', card:'#FFFFFF',
  border:'#E0E6EF', ink:'#1A2B4A', ink2:'#3D5170', ink3:'#6B7FA3',
};
const SW = 230;
const TH = 58;

/* ─── nav ──────────────────────────────────────────────────────── */
const NAV = [
  { section:'Main', items:[
    { id:'dashboard',     icon:'🏠', label:'Dashboard' },
    { id:'notifications', icon:'🔔', label:'Notifications', badge:5, badgeRed:true },
  ]},
  { section:'My Profile', items:[
    { id:'profile', icon:'👤', label:'My Profile', children:[
      { id:'profile-personal',        label:'Personal Information' },
      { id:'profile-qualifications',  label:'Educational Qualifications' },
      { id:'profile-experience',      label:'Work Experience' },
      { id:'profile-expertise',       label:'Domain & Skills' },
      { id:'profile-certifications',  label:'Certifications & Awards' },
      { id:'profile-docs',            label:'Documents & KYC' },
    ]},
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
  { section:'Support', items:[
    { id:'helpdesk',  icon:'🎧', label:'Help & Support' },
    { id:'grievance', icon:'📣', label:'Grievance' },
    { id:'faq',       icon:'❓', label:'FAQ' },
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
function Inp({ placeholder, type='text', value, defaultValue }) {
  return <input type={type} placeholder={placeholder} value={value} defaultValue={defaultValue}
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

export default function TrainerPortal() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [panel, setPanel] = useState('dashboard');
  const [openMenus, setOpenMenus] = useState({});
  const [searchQ, setSearchQ] = useState('');
  const [searchShow, setSearchShow] = useState(false);

  function go(id) { setPanel(id); window.scrollTo(0, 0); }
  function toggleMenu(id) { setOpenMenus(m => ({ ...m, [id]: !m[id] })); }
  function handleLogout() { logout(); navigate('/login'); }

  const searchResults = searchQ.trim()
    ? SEARCH_INDEX.filter(r => r.label.toLowerCase().includes(searchQ.toLowerCase())).slice(0, 8)
    : [];

  // ── SIDEBAR ──────────────────────────────────────────────────────
  function Sidebar() {
    return (
      <div style={{ position:'fixed', top:0, left:0, width:SW, height:'100vh', background:C.sidebar, overflowY:'auto', zIndex:200, display:'flex', flexDirection:'column' }}>
        <div style={{ padding:'0 16px', height:TH, display:'flex', alignItems:'center', gap:10, borderBottom:'1px solid rgba(255,255,255,.08)', flexShrink:0 }}>
          <div style={{ width:34, height:34, background:C.blue, borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>🎓</div>
          <div><div style={{ color:'#fff', fontWeight:800, fontSize:14 }}>SkillsNJobs</div><div style={{ color:'rgba(255,255,255,.4)', fontSize:9.5 }}>TRAINER PORTAL</div></div>
        </div>
        {NAV.map(sec => (
          <div key={sec.section}>
            <div style={{ padding:'14px 16px 4px', fontSize:9.5, fontWeight:700, color:'rgba(255,255,255,.3)', letterSpacing:'.08em', textTransform:'uppercase' }}>{sec.section}</div>
            {sec.items.map(item => (
              <div key={item.id}>
                <div onClick={() => item.children ? toggleMenu(item.id) : go(item.id)}
                  style={{ padding:'9px 16px', cursor:'pointer', display:'flex', alignItems:'center', gap:9,
                    color: panel===item.id ? '#fff' : 'rgba(255,255,255,.72)',
                    background: panel===item.id ? C.blue : 'transparent' }}
                  onMouseEnter={e => { if(panel!==item.id) e.currentTarget.style.background='rgba(255,255,255,.07)'; }}
                  onMouseLeave={e => { if(panel!==item.id) e.currentTarget.style.background='transparent'; }}>
                  <span style={{ width:20, textAlign:'center', fontSize:15, flexShrink:0 }}>{item.icon}</span>
                  <span style={{ flex:1, fontSize:13, fontWeight:500 }}>{item.label}</span>
                  {item.badge && <span style={{ background:C.red, color:'#fff', fontSize:10, fontWeight:700, padding:'1px 6px', borderRadius:10 }}>{item.badge}</span>}
                  {item.children && <span style={{ fontSize:10, transition:'.2s', transform: openMenus[item.id] ? 'rotate(90deg)' : 'none', display:'inline-block' }}>›</span>}
                </div>
                {item.children && openMenus[item.id] && (
                  <div style={{ background:'rgba(0,0,0,.15)' }}>
                    {item.children.map(c => (
                      <div key={c.id} onClick={() => go(c.id)}
                        style={{ padding:'7px 16px 7px 45px', cursor:'pointer', fontSize:12.5,
                          color: panel===c.id ? C.gold : 'rgba(255,255,255,.5)', fontWeight: panel===c.id ? 700 : 400 }}
                        onMouseEnter={e => { e.currentTarget.style.color='#fff'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = panel===c.id ? C.gold : 'rgba(255,255,255,.5)'; }}>
                        · {c.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  // ── TOPBAR ────────────────────────────────────────────────────────
  function Topbar() {
    return (
      <div style={{ position:'fixed', top:0, left:SW, right:0, height:TH, background:'#fff', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', padding:'0 20px', gap:12, zIndex:100, boxShadow:'0 1px 4px rgba(0,0,0,.06)' }}>
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
        <div style={{ display:'flex', alignItems:'center', gap:12, marginLeft:'auto' }}>
          <div style={{ cursor:'pointer', padding:6, position:'relative', fontSize:18 }} onClick={() => go('notifications')}>
            🔔<span style={{ position:'absolute', top:2, right:2, width:17, height:17, borderRadius:'50%', background:C.red, color:'#fff', fontSize:10, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center' }}>5</span>
          </div>
          <div style={{ width:38, height:38, borderRadius:'50%', background:C.blue, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:14 }}>AK</div>
          <div style={{ lineHeight:1.25 }}>
            <div style={{ fontWeight:700, fontSize:13.5 }}>{user?.name || 'Aryan Kapoor'}</div>
            <div style={{ fontSize:11.5, color:C.ink3 }}>Trainer · SkillBridge Institute</div>
          </div>
          <button onClick={handleLogout} style={{ background:C.blue, color:'#fff', border:'none', padding:'7px 16px', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer' }}>⏻ Sign Out</button>
        </div>
      </div>
    );
  }

  // ── PANELS ────────────────────────────────────────────────────────
  const u = { name: user?.name || 'Aryan Kapoor', email: user?.email || 'trainer@skillbridge.in', phone: user?.phone || '9876543210' };

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

  function PanelDashboard() {
    return <>
      <Alert type="info">📋 You have <strong>2 sessions today</strong>. Mark attendance before 5 PM to avoid compliance flag.</Alert>
      <SectionHead title={`Welcome, ${u.name}! 🎓`} />
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:20 }}>
        <KpiCard icon="📋" value="4" label="Active Batches" sub="86 learners enrolled" accent={C.blue} />
        <KpiCard icon="👥" value="86" label="My Learners" sub="Across all batches" accent={C.teal} />
        <KpiCard icon="✅" value="91%" label="Avg Attendance" sub="This month" accent={C.green} />
        <KpiCard icon="🏆" value="78%" label="Assessment Pass Rate" sub="Last assessment" accent={C.gold} />
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
        <Card>
          <CardTitle>📅 Today's Sessions</CardTitle>
          <Table headers={['Batch','Course','Time','Venue','Status']} rows={[
            <tr key="1"><Td>IT-2024-B3</Td><Td>React Fundamentals</Td><Td>10:00–12:00</Td><Td>Lab 3</Td><Td><Badge color="green">Ongoing</Badge></Td></tr>,
            <tr key="2"><Td>IT-2024-B4</Td><Td>Node.js Backend</Td><Td>2:00–4:00 PM</Td><Td>Lab 2</Td><Td><Badge color="blue">Upcoming</Badge></Td></tr>,
          ]} />
        </Card>
        <Card>
          <CardTitle>🔔 Recent Activity</CardTitle>
          <TlItem dot={C.green} title="Batch IT-2024-B3 attendance marked — 28/30 present" meta="Today · 12:05 PM" />
          <TlItem dot={C.blue}  title="Mock test results uploaded for B2" meta="Yesterday · 5:30 PM" />
          <TlItem dot={C.gold}  title="Assessment scheduled for B1 on Jul 8" meta="Jul 3, 2026" />
          <TlItem dot={C.teal}  title="5 new learners enrolled in B4" meta="Jul 2, 2026" />
        </Card>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        <Card>
          <CardTitle>📊 Batch Performance</CardTitle>
          <StatRow n="IT-2024-B1" label="React · 30 learners · 94% attendance" pct={94} color={C.green} />
          <StatRow n="IT-2024-B2" label="Node.js · 28 learners · 89% attendance" pct={89} color={C.blue} />
          <StatRow n="IT-2024-B3" label="React · 30 learners · 91% attendance" pct={91} color={C.teal} />
          <StatRow n="IT-2024-B4" label="Node.js · 26 learners · 88% attendance" pct={88} color={C.gold} />
        </Card>
        <Card>
          <CardTitle>📅 Upcoming This Week</CardTitle>
          <TlItem dot={C.blue}  title="Assessment — Batch B1 (React)" meta="Jul 8, 2026 · Lab 1" />
          <TlItem dot={C.teal}  title="Parent-Trainer Meet — B3" meta="Jul 9, 2026 · 3:00 PM" />
          <TlItem dot={C.gold}  title="PMKVY Progress Review" meta="Jul 10, 2026 · 11:00 AM" />
          <TlItem dot={C.purple} title="Certification ceremony — B2 completions" meta="Jul 12, 2026" />
        </Card>
      </div>
    </>;
  }

  function PanelNotifications() {
    return <>
      <SectionHead title="Notifications 🔔" />
      <Card>
        {[
          [C.gold,'⚠️ Mark attendance for today\'s 2:00 PM session (IT-2024-B4)','System · 2 hours ago'],
          [C.blue,'📋 Assessment scheduled for Batch B1 — React, Jul 8','Today · 9:00 AM'],
          [C.green,'✅ Batch B3 attendance accepted — 28/30 approved','Today · 12:10 PM'],
          [C.teal,'🎓 5 new learners enrolled in Batch IT-2024-B4','Jul 3, 2026'],
          [C.purple,'📊 Monthly trainer performance report is ready','Jul 2, 2026'],
          [C.red,'⚠️ Batch B2 has 3 at-risk learners — attendance below 60%','Jul 1, 2026'],
        ].map(([c,t,m]) => <TlItem key={t} dot={c} title={t} meta={m} />)}
      </Card>
    </>;
  }

  function PanelProfilePersonal() {
    return <>
      <SectionHead title="Personal Information 👤" />
      <Card>
        <G><Field label="Full Name"><Inp defaultValue={u.name} /></Field><Field label="Date of Birth"><Inp type="date" defaultValue="1988-04-15" /></Field></G>
        <G><Field label="Gender"><Sel options={['Male','Female','Other']} defaultValue="Male" /></Field><Field label="Category"><Sel options={['General','OBC','SC','ST','EWS']} defaultValue="General" /></Field></G>
        <G><Field label="Mobile Number"><ValidInp defaultValue={u.phone} validate="mobile" /></Field><Field label="Email Address"><ValidInp type="email" defaultValue={u.email} validate="email" /></Field></G>
        <G><Field label="Aadhaar Number"><ValidInp placeholder="12-digit Aadhaar" validate="aadhaar" /></Field><Field label="PAN Number"><ValidInp placeholder="ABCDE1234F" validate="pan" /></Field></G>
        <div style={{ textAlign:'right' }}><Btn primary>💾 Save Changes</Btn></div>
      </Card>
    </>;
  }

  function PanelProfileQualifications() {
    return <>
      <SectionHead title="Educational Qualifications 🎓" />
      <Card>
        <Table headers={['Degree','Institution','Year','Score']} rows={[
          <tr key="1"><Td>B.Tech (Computer Science)</Td><Td>NIT Warangal</Td><Td>2010</Td><Td>8.4 CGPA</Td></tr>,
          <tr key="2"><Td>12th Science (CBSE)</Td><Td>KV Hyderabad</Td><Td>2006</Td><Td>88%</Td></tr>,
        ]} />
        <div style={{ marginTop:14 }}><Btn primary>+ Add Qualification</Btn></div>
      </Card>
    </>;
  }

  function PanelProfileExperience() {
    return <>
      <SectionHead title="Work Experience 💼" />
      <Card>
        <Table headers={['Organisation','Role','From','To','Sector']} rows={[
          <tr key="1"><Td>SkillBridge Institute</Td><Td>Senior Trainer</Td><Td>Jan 2020</Td><Td>Present</Td><Td>IT-ITeS</Td></tr>,
          <tr key="2"><Td>Infosys BPO</Td><Td>Tech Lead</Td><Td>Jun 2015</Td><Td>Dec 2019</Td><Td>IT</Td></tr>,
          <tr key="3"><Td>Wipro Technologies</Td><Td>Software Engineer</Td><Td>Jul 2010</Td><Td>May 2015</Td><Td>IT</Td></tr>,
        ]} />
        <div style={{ marginTop:14 }}><Btn primary>+ Add Experience</Btn></div>
      </Card>
    </>;
  }

  function PanelProfileExpertise() {
    return <>
      <SectionHead title="Domain & Skills 🛠️" />
      <Card>
        <Field label="Primary Domain"><Sel options={['IT-ITeS','Electronics','Retail','BFSI','Healthcare','Logistics']} defaultValue="IT-ITeS" /></Field>
        <Field label="Courses You Can Train"><Inp defaultValue="React.js, Node.js, JavaScript, HTML/CSS, Python Basics" /></Field>
        <Field label="Sector Skill Council"><Inp defaultValue="IT-ITeS Sector Skill Council (NASSCOM)" /></Field>
        <G cols={3}>
          <Field label="Years of Training Exp."><Inp defaultValue="6" /></Field>
          <Field label="Batches Handled"><Inp defaultValue="24" /></Field>
          <Field label="Learners Trained"><Inp defaultValue="620" /></Field>
        </G>
        <div style={{ textAlign:'right' }}><Btn primary>💾 Save</Btn></div>
      </Card>
    </>;
  }

  function PanelProfileCertifications() {
    return <>
      <SectionHead title="Certifications & Awards 🏅" />
      <Card>
        <Table headers={['Certification','Issuing Body','Year','Valid Until']} rows={[
          <tr key="1"><Td>Certified Trainer (PMKVY)</Td><Td>NSDC</Td><Td>2021</Td><Td>2026</Td></tr>,
          <tr key="2"><Td>AWS Solutions Architect</Td><Td>Amazon</Td><Td>2022</Td><Td>2025</Td></tr>,
          <tr key="3"><Td>Best Trainer Award</Td><Td>SkillBridge Institute</Td><Td>2023</Td><Td>—</Td></tr>,
        ]} />
        <div style={{ marginTop:14 }}><Btn primary>+ Add Certification</Btn></div>
      </Card>
    </>;
  }

  function PanelProfileDocs() {
    return <>
      <SectionHead title="Documents & KYC 📄" />
      <Card>
        <Table headers={['Document','Status','Uploaded','Action']} rows={[
          <tr key="1"><Td>Aadhaar Card</Td><Td><Badge color="green">Verified</Badge></Td><Td>Jan 2024</Td><Td><Btn sm>Download</Btn></Td></tr>,
          <tr key="2"><Td>PAN Card</Td><Td><Badge color="green">Verified</Badge></Td><Td>Jan 2024</Td><Td><Btn sm>Download</Btn></Td></tr>,
          <tr key="3"><Td>Degree Certificate</Td><Td><Badge color="blue">Submitted</Badge></Td><Td>Mar 2024</Td><Td><Btn sm>Download</Btn></Td></tr>,
          <tr key="4"><Td>PMKVY Trainer Certificate</Td><Td><Badge color="gold">Under Review</Badge></Td><Td>Jun 2026</Td><Td><Btn sm>View</Btn></Td></tr>,
        ]} />
        <div style={{ marginTop:14 }}><Btn primary>📤 Upload Document</Btn></div>
      </Card>
    </>;
  }

  function PanelBatchActive() {
    return <>
      <SectionHead title="Active Batches 📋" />
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:20 }}>
        <KpiCard icon="📋" value="4" label="Active Batches" sub="" accent={C.blue} />
        <KpiCard icon="👥" value="86" label="Total Learners" sub="" accent={C.teal} />
        <KpiCard icon="✅" value="91%" label="Avg Attendance" sub="" accent={C.green} />
        <KpiCard icon="📅" value="14" label="Sessions Left" sub="This month" accent={C.gold} />
      </div>
      <Card>
        <Table headers={['Batch ID','Course','Learners','Progress','Attendance','Status']} rows={[
          <tr key="1"><Td>IT-2024-B1</Td><Td>React.js</Td><Td>30</Td><Td><Badge color="green">75%</Badge></Td><Td>94%</Td><Td><Badge color="green">Active</Badge></Td></tr>,
          <tr key="2"><Td>IT-2024-B2</Td><Td>Node.js</Td><Td>28</Td><Td><Badge color="blue">60%</Badge></Td><Td>89%</Td><Td><Badge color="green">Active</Badge></Td></tr>,
          <tr key="3"><Td>IT-2024-B3</Td><Td>React.js</Td><Td>30</Td><Td><Badge color="teal">45%</Badge></Td><Td>91%</Td><Td><Badge color="green">Active</Badge></Td></tr>,
          <tr key="4"><Td>IT-2024-B4</Td><Td>Node.js</Td><Td>26</Td><Td><Badge color="gold">20%</Badge></Td><Td>88%</Td><Td><Badge color="blue">Active</Badge></Td></tr>,
        ]} />
      </Card>
    </>;
  }

  function PanelBatchUpcoming() {
    return <>
      <SectionHead title="Upcoming Batches 📅" />
      <Card>
        <Table headers={['Batch ID','Course','Start Date','Seats','Status']} rows={[
          <tr key="1"><Td>IT-2024-B5</Td><Td>Python Basics</Td><Td>Aug 1, 2026</Td><Td>30</Td><Td><Badge color="gold">Filling</Badge></Td></tr>,
          <tr key="2"><Td>IT-2024-B6</Td><Td>Data Analytics</Td><Td>Aug 15, 2026</Td><Td>25</Td><Td><Badge color="blue">Planned</Badge></Td></tr>,
        ]} />
        <div style={{ marginTop:14 }}><Btn primary>+ Plan New Batch</Btn></div>
      </Card>
    </>;
  }

  function PanelBatchCompleted() {
    return <>
      <SectionHead title="Completed Batches ✅" />
      <Card>
        <Table headers={['Batch ID','Course','Learners','Certified','Placed','Duration']} rows={[
          <tr key="1"><Td>IT-2023-B8</Td><Td>React.js</Td><Td>30</Td><Td>28</Td><Td>22</Td><Td>3 months</Td></tr>,
          <tr key="2"><Td>IT-2023-B7</Td><Td>Node.js</Td><Td>25</Td><Td>23</Td><Td>19</Td><Td>3 months</Td></tr>,
          <tr key="3"><Td>IT-2023-B6</Td><Td>JavaScript</Td><Td>28</Td><Td>26</Td><Td>20</Td><Td>2 months</Td></tr>,
        ]} />
      </Card>
    </>;
  }

  function PanelBatchCreate() {
    return <>
      <SectionHead title="Create New Batch 🆕" />
      <Card>
        <G><Field label="Batch Name / ID"><Inp placeholder="e.g. IT-2024-B5" /></Field><Field label="Course"><Sel options={['React.js Fundamentals','Node.js Backend','Python Basics','Data Analytics','JavaScript Essentials']} /></Field></G>
        <G cols={3}><Field label="Start Date"><Inp type="date" /></Field><Field label="End Date"><Inp type="date" /></Field><Field label="Duration (hours)"><Inp defaultValue="300" /></Field></G>
        <G cols={3}><Field label="Batch Capacity"><Inp defaultValue="30" /></Field><Field label="Centre"><Sel options={['SkillBridge Bengaluru','SkillBridge Hyderabad','SkillBridge Pune']} /></Field><Field label="Mode"><Sel options={['Classroom','Online','Hybrid']} /></Field></G>
        <div style={{ textAlign:'right', display:'flex', gap:10, justifyContent:'flex-end' }}><Btn>Save Draft</Btn><Btn primary>🚀 Create Batch</Btn></div>
      </Card>
    </>;
  }

  function PanelSessionSchedule() {
    return <>
      <SectionHead title="Schedule Sessions 📅" />
      <Card>
        <G><Field label="Batch"><Sel options={['IT-2024-B1','IT-2024-B2','IT-2024-B3','IT-2024-B4']} /></Field><Field label="Topic"><Inp placeholder="e.g. React Hooks Deep Dive" /></Field></G>
        <G cols={3}><Field label="Date"><Inp type="date" /></Field><Field label="Start Time"><Inp type="time" /></Field><Field label="Duration (hrs)"><Inp defaultValue="2" /></Field></G>
        <G><Field label="Venue / Link"><Inp placeholder="Lab 3 / https://meet.google.com/..." /></Field><Field label="Mode"><Sel options={['Classroom','Online','Hybrid']} /></Field></G>
        <div style={{ textAlign:'right' }}><Btn primary>📅 Schedule Session</Btn></div>
      </Card>
    </>;
  }

  function PanelSessionToday() {
    return <>
      <SectionHead title="Today's Sessions 📆" />
      <Card>
        <Table headers={['Batch','Topic','Time','Venue','Attendance','Status']} rows={[
          <tr key="1"><Td>IT-2024-B3</Td><Td>React Hooks</Td><Td>10:00–12:00</Td><Td>Lab 3</Td><Td><Badge color="green">28/30 marked</Badge></Td><Td><Badge color="green">Done</Badge></Td></tr>,
          <tr key="2"><Td>IT-2024-B4</Td><Td>Node.js REST APIs</Td><Td>2:00–4:00 PM</Td><Td>Lab 2</Td><Td><Badge color="gold">Pending</Badge></Td><Td><Badge color="blue">Upcoming</Badge></Td></tr>,
        ]} />
        <Alert type="warn">⚠️ Mark attendance for IT-2024-B4 before 5:00 PM today.</Alert>
      </Card>
    </>;
  }

  function PanelSessionCalendar() {
    return <>
      <SectionHead title="Training Calendar 🗓️" />
      <Card>
        <Alert type="info">Full calendar view — showing July 2026.</Alert>
        <Table headers={['Date','Batch','Topic','Time','Mode']} rows={[
          <tr key="1"><Td>Jul 4</Td><Td>B3, B4</Td><Td>React Hooks / REST APIs</Td><Td>10 AM, 2 PM</Td><Td>Classroom</Td></tr>,
          <tr key="2"><Td>Jul 5</Td><Td>B1, B2</Td><Td>State Management / Middleware</Td><Td>10 AM, 2 PM</Td><Td>Classroom</Td></tr>,
          <tr key="3"><Td>Jul 7</Td><Td>B3, B4</Td><Td>Context API / Auth</Td><Td>10 AM, 2 PM</Td><Td>Classroom</Td></tr>,
          <tr key="4"><Td>Jul 8</Td><Td>B1</Td><Td>Assessment — React</Td><Td>10 AM</Td><Td>Lab 1</Td></tr>,
          <tr key="5"><Td>Jul 9</Td><Td>B1, B2</Td><Td>Redux / Testing</Td><Td>10 AM, 2 PM</Td><Td>Classroom</Td></tr>,
        ]} />
      </Card>
    </>;
  }

  function PanelSessionReschedule() {
    return <>
      <SectionHead title="Reschedule / Cancel Session ⚠️" />
      <Card>
        <G><Field label="Batch"><Sel options={['IT-2024-B1','IT-2024-B2','IT-2024-B3','IT-2024-B4']} /></Field><Field label="Session"><Sel options={['Jul 5 · State Management','Jul 7 · Context API','Jul 9 · Redux']} /></Field></G>
        <G><Field label="New Date"><Inp type="date" /></Field><Field label="New Time"><Inp type="time" /></Field></G>
        <Field label="Reason"><textarea rows={3} placeholder="Reason for rescheduling..." style={{ width:'100%', padding:'9px 12px', border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:13.5, outline:'none', fontFamily:'inherit' }} /></Field>
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}><Btn red>❌ Cancel Session</Btn><Btn primary>🔄 Reschedule</Btn></div>
      </Card>
    </>;
  }

  function PanelAttendanceMark() {
    return <>
      <SectionHead title="Mark Attendance ✅" />
      <Card>
        <G cols={3}><Field label="Batch"><Sel options={['IT-2024-B3','IT-2024-B4','IT-2024-B1','IT-2024-B2']} /></Field><Field label="Session Date"><Inp type="date" /></Field><Field label="Session"><Sel options={['10:00–12:00 · React Hooks','2:00–4:00 · REST APIs']} /></Field></G>
      </Card>
      <Card>
        <CardTitle>👥 Learner Attendance — IT-2024-B3</CardTitle>
        <Table headers={['Name','Enrollment No.','Status','Remarks']} rows={[
          <tr key="1"><Td>Priya Verma</Td><Td>SNJ-2024-001</Td><Td><Badge color="green">Present</Badge></Td><Td>—</Td></tr>,
          <tr key="2"><Td>Rahul Kumar</Td><Td>SNJ-2024-002</Td><Td><Badge color="green">Present</Badge></Td><Td>—</Td></tr>,
          <tr key="3"><Td>Sneha Iyer</Td><Td>SNJ-2024-003</Td><Td><Badge color="red">Absent</Badge></Td><Td>Medical leave</Td></tr>,
          <tr key="4"><Td>Amit Singh</Td><Td>SNJ-2024-004</Td><Td><Badge color="gold">Late</Badge></Td><Td>Arrived 30 min late</Td></tr>,
        ]} />
        <div style={{ marginTop:14, textAlign:'right' }}><Btn primary>💾 Submit Attendance</Btn></div>
      </Card>
    </>;
  }

  function PanelAttendanceReports() {
    return <>
      <SectionHead title="Attendance Reports 📊" />
      <Card>
        <Table headers={['Batch','Sessions','Avg Attendance','Absent >2','Below 60%']} rows={[
          <tr key="1"><Td>IT-2024-B1</Td><Td>24</Td><Td><Badge color="green">94%</Badge></Td><Td>2 learners</Td><Td>0</Td></tr>,
          <tr key="2"><Td>IT-2024-B2</Td><Td>18</Td><Td><Badge color="teal">89%</Badge></Td><Td>4 learners</Td><Td>1</Td></tr>,
          <tr key="3"><Td>IT-2024-B3</Td><Td>14</Td><Td><Badge color="green">91%</Badge></Td><Td>3 learners</Td><Td>0</Td></tr>,
          <tr key="4"><Td>IT-2024-B4</Td><Td>6</Td><Td><Badge color="blue">88%</Badge></Td><Td>2 learners</Td><Td>0</Td></tr>,
        ]} />
        <div style={{ marginTop:14, display:'flex', gap:10 }}><Btn primary>📥 Download Report</Btn></div>
      </Card>
    </>;
  }

  function PanelAttendanceSummary() {
    return <>
      <SectionHead title="Batch-wise Attendance Summary 📈" />
      <Card>
        <StatRow n="94%" label="IT-2024-B1 · React.js" pct={94} color={C.green} />
        <StatRow n="89%" label="IT-2024-B2 · Node.js" pct={89} color={C.blue} />
        <StatRow n="91%" label="IT-2024-B3 · React.js" pct={91} color={C.teal} />
        <StatRow n="88%" label="IT-2024-B4 · Node.js" pct={88} color={C.gold} />
      </Card>
    </>;
  }

  function PanelLearnerList() {
    return <>
      <SectionHead title="All Learners 👥" />
      <Card>
        <Table headers={['Name','Batch','Enrollment No.','Progress','Attendance','Status']} rows={[
          <tr key="1"><Td>Priya Verma</Td><Td>B1</Td><Td>SNJ-2024-001</Td><Td><Badge color="green">80%</Badge></Td><Td>96%</Td><Td><Badge color="green">On Track</Badge></Td></tr>,
          <tr key="2"><Td>Rahul Kumar</Td><Td>B2</Td><Td>SNJ-2024-002</Td><Td><Badge color="blue">65%</Badge></Td><Td>88%</Td><Td><Badge color="blue">Active</Badge></Td></tr>,
          <tr key="3"><Td>Sneha Iyer</Td><Td>B3</Td><Td>SNJ-2024-003</Td><Td><Badge color="teal">45%</Badge></Td><Td>72%</Td><Td><Badge color="gold">Needs Attention</Badge></Td></tr>,
          <tr key="4"><Td>Deepak Rao</Td><Td>B2</Td><Td>SNJ-2024-010</Td><Td><Badge color="red">30%</Badge></Td><Td>55%</Td><Td><Badge color="red">At Risk</Badge></Td></tr>,
        ]} />
      </Card>
    </>;
  }

  function PanelLearnerProgress() {
    return <>
      <SectionHead title="Learning Progress 📈" />
      <Card>
        <StatRow n="18/30" label="IT-2024-B1 · 60%+ progress" pct={60} color={C.green} />
        <StatRow n="14/28" label="IT-2024-B2 · 50%+ progress" pct={50} color={C.blue} />
        <StatRow n="10/30" label="IT-2024-B3 · 33%+ progress" pct={33} color={C.teal} />
        <StatRow n="5/26"  label="IT-2024-B4 · 19%+ progress" pct={19} color={C.gold} />
      </Card>
    </>;
  }

  function PanelLearnerDropout() {
    return <>
      <SectionHead title="Dropout / At-Risk Learners ⚠️" />
      <Alert type="red">3 learners are below 60% attendance and at risk of dropout. Take action before the next assessment.</Alert>
      <Card>
        <Table headers={['Name','Batch','Attendance','Progress','Last Session','Action']} rows={[
          <tr key="1"><Td>Deepak Rao</Td><Td>B2</Td><Td><Badge color="red">55%</Badge></Td><Td>30%</Td><Td>Jun 28</Td><Td><Btn sm primary>Counsel</Btn></Td></tr>,
          <tr key="2"><Td>Neha Sharma</Td><Td>B1</Td><Td><Badge color="gold">62%</Badge></Td><Td>45%</Td><Td>Jul 1</Td><Td><Btn sm>Alert</Btn></Td></tr>,
          <tr key="3"><Td>Ravi Gupta</Td><Td>B3</Td><Td><Badge color="gold">65%</Badge></Td><Td>40%</Td><Td>Jul 2</Td><Td><Btn sm>Alert</Btn></Td></tr>,
        ]} />
      </Card>
    </>;
  }

  function PanelLearnerPlacement() {
    return <>
      <SectionHead title="Placement Status 🏢" />
      <Card>
        <Table headers={['Name','Batch','Skill','Company','CTC','Status']} rows={[
          <tr key="1"><Td>Priya Verma</Td><Td>B1</Td><Td>React.js</Td><Td>TechNova Pvt Ltd</Td><Td>₹7.5 LPA</Td><Td><Badge color="green">Placed</Badge></Td></tr>,
          <tr key="2"><Td>Arun Shetty</Td><Td>B1</Td><Td>React.js</Td><Td>Infosys</Td><Td>₹6.0 LPA</Td><Td><Badge color="green">Placed</Badge></Td></tr>,
          <tr key="3"><Td>Kiran Reddy</Td><Td>B2</Td><Td>Node.js</Td><Td>—</Td><Td>—</Td><Td><Badge color="gold">Seeking</Badge></Td></tr>,
        ]} />
      </Card>
    </>;
  }

  function PanelAssessSchedule() {
    return <>
      <SectionHead title="Assessment Schedule 📝" />
      <Card>
        <G><Field label="Batch"><Sel options={['IT-2024-B1','IT-2024-B2','IT-2024-B3','IT-2024-B4']} /></Field><Field label="Assessment Type"><Sel options={['Mid-term','Final','Mock','RPL']} /></Field></G>
        <G cols={3}><Field label="Date"><Inp type="date" /></Field><Field label="Duration (hrs)"><Inp defaultValue="2" /></Field><Field label="Total Marks"><Inp defaultValue="100" /></Field></G>
        <G><Field label="Passing Marks"><Inp defaultValue="50" /></Field><Field label="Assessor Name"><Inp defaultValue="SSC-Designated Assessor" /></Field></G>
        <div style={{ textAlign:'right' }}><Btn primary>📅 Schedule Assessment</Btn></div>
      </Card>
      <Card>
        <CardTitle>📋 Upcoming Assessments</CardTitle>
        <Table headers={['Batch','Type','Date','Assessor','Status']} rows={[
          <tr key="1"><Td>IT-2024-B1</Td><Td>Final · React.js</Td><Td>Jul 8, 2026</Td><Td>SSC Assessor</Td><Td><Badge color="blue">Scheduled</Badge></Td></tr>,
          <tr key="2"><Td>IT-2024-B2</Td><Td>Mid-term · Node.js</Td><Td>Jul 15, 2026</Td><Td>SSC Assessor</Td><Td><Badge color="gold">Pending Confirm</Badge></Td></tr>,
        ]} />
      </Card>
    </>;
  }

  function PanelAssessResults() {
    return <>
      <SectionHead title="Assessment Results 📊" />
      <Card>
        <Table headers={['Learner','Batch','Assessment','Score','Pass/Fail','Cert Eligible']} rows={[
          <tr key="1"><Td>Priya Verma</Td><Td>B1</Td><Td>Mid-term</Td><Td>82/100</Td><Td><Badge color="green">Pass</Badge></Td><Td><Badge color="green">Yes</Badge></Td></tr>,
          <tr key="2"><Td>Rahul Kumar</Td><Td>B2</Td><Td>Mid-term</Td><Td>67/100</Td><Td><Badge color="green">Pass</Badge></Td><Td><Badge color="green">Yes</Badge></Td></tr>,
          <tr key="3"><Td>Deepak Rao</Td><Td>B2</Td><Td>Mid-term</Td><Td>38/100</Td><Td><Badge color="red">Fail</Badge></Td><Td><Badge color="red">No</Badge></Td></tr>,
        ]} />
        <div style={{ marginTop:14 }}><Btn primary>📥 Download Scorecards</Btn></div>
      </Card>
    </>;
  }

  function PanelAssessRPL() {
    return <>
      <SectionHead title="RPL Assessment 🔖" />
      <Alert type="info">Recognition of Prior Learning (RPL) allows experienced workers to get NSQF certification without full training. Conduct assessment as per SSC guidelines.</Alert>
      <Card>
        <Table headers={['Candidate','Trade','Experience','Assessment Date','Status']} rows={[
          <tr key="1"><Td>Mohan Lal</Td><Td>IT Support</Td><Td>8 years</Td><Td>Jul 10, 2026</Td><Td><Badge color="blue">Scheduled</Badge></Td></tr>,
          <tr key="2"><Td>Suresh Babu</Td><Td>Web Dev</Td><Td>5 years</Td><Td>Jul 12, 2026</Td><Td><Badge color="gold">Pending</Badge></Td></tr>,
        ]} />
      </Card>
    </>;
  }

  function PanelAssessMock() {
    return <>
      <SectionHead title="Mock Tests 🧪" />
      <Card>
        <G><Field label="Batch"><Sel options={['IT-2024-B1','IT-2024-B2','IT-2024-B3','IT-2024-B4']} /></Field><Field label="Subject"><Inp placeholder="e.g. JavaScript Fundamentals" /></Field></G>
        <G cols={3}><Field label="Date"><Inp type="date" /></Field><Field label="Duration (min)"><Inp defaultValue="60" /></Field><Field label="Questions"><Inp defaultValue="50" /></Field></G>
        <div style={{ textAlign:'right' }}><Btn primary>🧪 Create Mock Test</Btn></div>
      </Card>
      <Card>
        <CardTitle>📋 Recent Mock Tests</CardTitle>
        <Table headers={['Batch','Subject','Date','Appeared','Avg Score']} rows={[
          <tr key="1"><Td>IT-2024-B1</Td><Td>React.js Basics</Td><Td>Jun 28</Td><Td>28/30</Td><Td>72%</Td></tr>,
          <tr key="2"><Td>IT-2024-B2</Td><Td>Node.js Core</Td><Td>Jun 30</Td><Td>25/28</Td><Td>68%</Td></tr>,
        ]} />
      </Card>
    </>;
  }

  function PanelContentMaterials() {
    return <>
      <SectionHead title="Study Materials 📚" />
      <Card>
        <Table headers={['Title','Type','Batch','Uploaded','Downloads']} rows={[
          <tr key="1"><Td>React.js Handbook v2</Td><Td>PDF</Td><Td>B1, B3</Td><Td>Jun 1, 2026</Td><Td>54</Td></tr>,
          <tr key="2"><Td>Node.js REST API Guide</Td><Td>PDF</Td><Td>B2, B4</Td><Td>Jun 10, 2026</Td><Td>42</Td></tr>,
          <tr key="3"><Td>JavaScript Cheat Sheet</Td><Td>PDF</Td><Td>All</Td><Td>May 20, 2026</Td><Td>86</Td></tr>,
        ]} />
        <div style={{ marginTop:14 }}><Btn primary>📤 Upload Material</Btn></div>
      </Card>
    </>;
  }

  function PanelContentVideos() {
    return <>
      <SectionHead title="Video Lectures 🎥" />
      <Card>
        <Table headers={['Title','Duration','Batch','Views','Status']} rows={[
          <tr key="1"><Td>React Hooks Explained</Td><Td>45 min</Td><Td>B1, B3</Td><Td>124</Td><Td><Badge color="green">Published</Badge></Td></tr>,
          <tr key="2"><Td>Node.js Event Loop</Td><Td>38 min</Td><Td>B2, B4</Td><Td>98</Td><Td><Badge color="green">Published</Badge></Td></tr>,
          <tr key="3"><Td>JWT Authentication</Td><Td>52 min</Td><Td>All</Td><Td>67</Td><Td><Badge color="gold">Processing</Badge></Td></tr>,
        ]} />
        <div style={{ marginTop:14 }}><Btn primary>📤 Upload Video</Btn></div>
      </Card>
    </>;
  }

  function PanelContentUpload() {
    return <>
      <SectionHead title="Upload Content 📤" />
      <Card>
        <G><Field label="Content Type"><Sel options={['Study Material (PDF)','Video Lecture','Assignment','Practice Questions','Other']} /></Field><Field label="Target Batch(es)"><Sel options={['All Batches','IT-2024-B1','IT-2024-B2','IT-2024-B3','IT-2024-B4']} /></Field></G>
        <Field label="Title"><Inp placeholder="e.g. React Hooks — Week 4 Notes" /></Field>
        <Field label="Description"><textarea rows={3} placeholder="Brief description of the content…" style={{ width:'100%', padding:'9px 12px', border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:13.5, outline:'none', fontFamily:'inherit' }} /></Field>
        <Field label="File"><input type="file" style={{ padding:'9px 0', fontSize:13 }} /></Field>
        <div style={{ textAlign:'right' }}><Btn primary>📤 Upload</Btn></div>
      </Card>
    </>;
  }

  function PanelContentLibrary() {
    return <>
      <SectionHead title="Resource Library 📖" />
      <Card>
        <Table headers={['Resource','Type','Source','Added','Action']} rows={[
          <tr key="1"><Td>NSDC Curriculum — IT-ITeS</Td><Td>PDF</Td><Td>NSDC</Td><Td>Jan 2026</Td><Td><Btn sm>Download</Btn></Td></tr>,
          <tr key="2"><Td>React Official Docs v18</Td><Td>Link</Td><Td>react.dev</Td><Td>Mar 2026</Td><Td><Btn sm>Open</Btn></Td></tr>,
          <tr key="3"><Td>Node.js Best Practices</Td><Td>PDF</Td><Td>GitHub</Td><Td>Apr 2026</Td><Td><Btn sm>Download</Btn></Td></tr>,
        ]} />
        <div style={{ marginTop:14 }}><Btn primary>+ Add Resource</Btn></div>
      </Card>
    </>;
  }

  function PanelCertIssue() {
    return <>
      <SectionHead title="Issue Certificates 🏆" />
      <Alert type="info">Certificates are issued after assessment pass and 70%+ attendance confirmation. NSDC approval required for PMKVY batches.</Alert>
      <Card>
        <Table headers={['Learner','Batch','Assessment','Attendance','Eligible','Action']} rows={[
          <tr key="1"><Td>Priya Verma</Td><Td>B1</Td><Td><Badge color="green">Pass (82%)</Badge></Td><Td>96%</Td><Td><Badge color="green">Yes</Badge></Td><Td><Btn sm primary>Issue</Btn></Td></tr>,
          <tr key="2"><Td>Arun Shetty</Td><Td>B1</Td><Td><Badge color="green">Pass (74%)</Badge></Td><Td>91%</Td><Td><Badge color="green">Yes</Badge></Td><Td><Btn sm primary>Issue</Btn></Td></tr>,
          <tr key="3"><Td>Deepak Rao</Td><Td>B2</Td><Td><Badge color="red">Fail (38%)</Badge></Td><Td>55%</Td><Td><Badge color="red">No</Badge></Td><Td>—</Td></tr>,
        ]} />
      </Card>
    </>;
  }

  function PanelCertIssued() {
    return <>
      <SectionHead title="Issued Certificates 📜" />
      <Card>
        <Table headers={['Cert No.','Learner','Course','NSQF Level','Issued On','Action']} rows={[
          <tr key="1"><Td>CERT-2026-00412</Td><Td>Priya Verma</Td><Td>React.js</Td><Td>Level 4</Td><Td>Jun 30, 2026</Td><Td><Btn sm>View</Btn></Td></tr>,
          <tr key="2"><Td>CERT-2026-00398</Td><Td>Arun Shetty</Td><Td>React.js</Td><Td>Level 4</Td><Td>Jun 30, 2026</Td><Td><Btn sm>View</Btn></Td></tr>,
          <tr key="3"><Td>CERT-2025-00312</Td><Td>Kiran Mehta</Td><Td>Node.js</Td><Td>Level 5</Td><Td>Mar 15, 2026</Td><Td><Btn sm>View</Btn></Td></tr>,
        ]} />
        <div style={{ marginTop:14 }}><Btn primary>📥 Bulk Download</Btn></div>
      </Card>
    </>;
  }

  function PanelCertVerify() {
    return <>
      <SectionHead title="Verify Certificate 🔍" />
      <Card>
        <Field label="Certificate Number"><Inp placeholder="e.g. CERT-2026-00412" /></Field>
        <div style={{ textAlign:'right', marginBottom:16 }}><Btn primary>🔍 Verify</Btn></div>
        <Alert type="success">✅ Certificate CERT-2026-00412 is valid. Issued to Priya Verma for React.js (NSQF Level 4) on Jun 30, 2026.</Alert>
      </Card>
    </>;
  }

  function PanelReportBatch() {
    return <>
      <SectionHead title="Batch Performance Reports 📊" />
      <Card>
        <Table headers={['Batch','Enrolled','Completed','Pass %','Placed','Drop-out']} rows={[
          <tr key="1"><Td>IT-2024-B1</Td><Td>30</Td><Td>28</Td><Td><Badge color="green">85%</Badge></Td><Td>22</Td><Td>2</Td></tr>,
          <tr key="2"><Td>IT-2024-B2</Td><Td>28</Td><Td>25</Td><Td><Badge color="teal">80%</Badge></Td><Td>19</Td><Td>3</Td></tr>,
          <tr key="3"><Td>IT-2024-B3</Td><Td>30</Td><Td>—</Td><Td>—</Td><Td>—</Td><Td>1</Td></tr>,
        ]} />
        <div style={{ marginTop:14 }}><Btn primary>📥 Download</Btn></div>
      </Card>
    </>;
  }

  function PanelReportAttendance() {
    return <>
      <SectionHead title="Attendance Analytics 📈" />
      <Card>
        <StatRow n="94%" label="IT-2024-B1 (React.js)" pct={94} color={C.green} />
        <StatRow n="89%" label="IT-2024-B2 (Node.js)" pct={89} color={C.blue} />
        <StatRow n="91%" label="IT-2024-B3 (React.js)" pct={91} color={C.teal} />
        <StatRow n="88%" label="IT-2024-B4 (Node.js)" pct={88} color={C.gold} />
      </Card>
    </>;
  }

  function PanelReportAssessment() {
    return <>
      <SectionHead title="Assessment Analytics 📝" />
      <Card>
        <Table headers={['Batch','Assessment','Appeared','Pass','Fail','Avg Score']} rows={[
          <tr key="1"><Td>IT-2024-B1</Td><Td>Mid-term</Td><Td>30</Td><Td>26</Td><Td>4</Td><Td>74%</Td></tr>,
          <tr key="2"><Td>IT-2024-B2</Td><Td>Mid-term</Td><Td>28</Td><Td>22</Td><Td>6</Td><Td>68%</Td></tr>,
        ]} />
      </Card>
    </>;
  }

  function PanelReportPlacement() {
    return <>
      <SectionHead title="Placement Analytics 🏢" />
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:20 }}>
        <KpiCard icon="🏆" value="41" label="Total Placed" sub="FY 2025-26" accent={C.green} />
        <KpiCard icon="💰" value="₹6.2 LPA" label="Avg CTC" sub="" accent={C.blue} />
        <KpiCard icon="📅" value="22 days" label="Avg Time to Place" sub="" accent={C.teal} />
        <KpiCard icon="✅" value="85%" label="Placement Rate" sub="Of certified learners" accent={C.gold} />
      </div>
      <Card>
        <Table headers={['Learner','Batch','Company','CTC','Source']} rows={[
          <tr key="1"><Td>Priya Verma</Td><Td>B1</Td><Td>TechNova</Td><Td>₹7.5 LPA</Td><Td>Campus Drive</Td></tr>,
          <tr key="2"><Td>Arun Shetty</Td><Td>B1</Td><Td>Infosys</Td><Td>₹6.0 LPA</Td><Td>Skill India Portal</Td></tr>,
        ]} />
      </Card>
    </>;
  }

  function PanelReportTrainer() {
    return <>
      <SectionHead title="My Performance 🌟" />
      <Card>
        <Table headers={['Metric','My Score','Benchmark','Rank']} rows={[
          <tr key="1"><Td>Avg Attendance</Td><Td>91%</Td><Td>82%</Td><Td><Badge color="green">Top 15%</Badge></Td></tr>,
          <tr key="2"><Td>Assessment Pass Rate</Td><Td>78%</Td><Td>72%</Td><Td><Badge color="blue">Above Avg</Badge></Td></tr>,
          <tr key="3"><Td>Placement Rate</Td><Td>85%</Td><Td>74%</Td><Td><Badge color="green">Top 20%</Badge></Td></tr>,
          <tr key="4"><Td>Learner Satisfaction</Td><Td>4.6 / 5</Td><Td>4.1</Td><Td><Badge color="green">Excellent</Badge></Td></tr>,
        ]} />
      </Card>
    </>;
  }

  function PanelSchemePmkvy() {
    return <>
      <SectionHead title="PMKVY 4.0 🏛️" />
      <Alert type="success">✅ You are a certified PMKVY trainer. Your current batches IT-2024-B1 and B2 are PMKVY-funded.</Alert>
      <Card>
        <Table headers={['Batch','Enrolled','Certified','Incentive','Status']} rows={[
          <tr key="1"><Td>IT-2024-B1</Td><Td>30</Td><Td>28</Td><Td><Badge color="green">₹14,000 Claimed</Badge></Td><Td>Active</Td></tr>,
          <tr key="2"><Td>IT-2024-B2</Td><Td>28</Td><Td>22</Td><Td><Badge color="gold">Pending</Badge></Td><Td>Active</Td></tr>,
        ]} />
      </Card>
    </>;
  }

  function PanelSchemeRPL() {
    return <>
      <SectionHead title="RPL — Recognition of Prior Learning 🔖" />
      <Alert type="info">RPL allows experienced workers to get NSQF certification based on demonstrated skills. Conduct assessment per SSC-prescribed methodology.</Alert>
      <Card>
        <Table headers={['Candidate','Trade','Experience','Result','Action']} rows={[
          <tr key="1"><Td>Mohan Lal</Td><Td>IT Support</Td><Td>8 yrs</Td><Td><Badge color="gold">Awaiting</Badge></Td><Td><Btn sm primary>Assess</Btn></Td></tr>,
        ]} />
      </Card>
    </>;
  }

  function PanelSchemeNAPS() {
    return <>
      <SectionHead title="NAPS / NATS 🎓" />
      <Alert type="info">National Apprenticeship Promotion Scheme — on-the-job training for learners. You can recommend placed learners for NAPS to employers.</Alert>
      <Card>
        <Table headers={['Learner','Employer','Trade','Status']} rows={[
          <tr key="1"><Td>Kiran Reddy</Td><Td>TechNova Pvt Ltd</Td><Td>Software Testing</Td><Td><Badge color="teal">Enrolled</Badge></Td></tr>,
          <tr key="2"><Td>Suresh Kumar</Td><Td>Infosys</Td><Td>Data Entry</Td><Td><Badge color="gold">Pending</Badge></Td></tr>,
        ]} />
      </Card>
    </>;
  }

  function PanelSchemeDDU() {
    return <>
      <SectionHead title="DDU-GKY 🌾" />
      <Alert type="info">Deen Dayal Upadhyaya Grameen Kaushalya Yojana — target rural youth from BPL families. Mandatory placement after training.</Alert>
      <Card>
        <Table headers={['Batch','Rural Learners','Placed','Stipend','Status']} rows={[
          <tr key="1"><Td>IT-2024-B1</Td><Td>8</Td><Td>7</Td><Td>₹56,000</Td><Td><Badge color="green">Compliant</Badge></Td></tr>,
        ]} />
      </Card>
    </>;
  }

  function PanelHelpdesk() {
    return <>
      <SectionHead title="Help & Support 🎧" />
      <Card>
        <G><Field label="Category"><Sel options={['Batch Issue','Assessment Query','Certificate','Technical','Salary / Payment','Other']} /></Field><Field label="Priority"><Sel options={['Low','Medium','High']} defaultValue="Medium" /></Field></G>
        <Field label="Subject"><Inp placeholder="Brief description" /></Field>
        <Field label="Details"><textarea rows={4} placeholder="Describe your issue in detail…" style={{ width:'100%', padding:'9px 12px', border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:13.5, outline:'none', fontFamily:'inherit' }} /></Field>
        <div style={{ textAlign:'right' }}><Btn primary>📩 Submit Ticket</Btn></div>
      </Card>
      <Card>
        <CardTitle>📋 My Tickets</CardTitle>
        <Table headers={['Ticket ID','Category','Status','Updated']} rows={[
          <tr key="1"><Td>TKT-00214</Td><Td>Certificate</Td><Td><Badge color="green">Resolved</Badge></Td><Td>Jul 2, 2026</Td></tr>,
          <tr key="2"><Td>TKT-00198</Td><Td>Payment</Td><Td><Badge color="gold">In Progress</Badge></Td><Td>Jun 28, 2026</Td></tr>,
        ]} />
      </Card>
    </>;
  }

  function PanelGrievance() {
    return <>
      <SectionHead title="Grievance 📣" />
      <Card>
        <Field label="Grievance Type"><Sel options={['Salary / Payment Delay','Facilities Issue','Assessment Irregularity','Unfair Treatment','Other']} /></Field>
        <Field label="Against (if applicable)"><Inp placeholder="e.g. Training Partner Management" /></Field>
        <Field label="Details"><textarea rows={5} placeholder="Describe your grievance with dates and amounts…" style={{ width:'100%', padding:'9px 12px', border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:13.5, outline:'none', fontFamily:'inherit' }} /></Field>
        <div style={{ textAlign:'right' }}><Btn red>📤 Submit Grievance</Btn></div>
      </Card>
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
    return <>
      <SectionHead title="Account Preferences ⚙️" />
      <Card>
        <CardTitle>👤 Account Information</CardTitle>
        <G><Field label="Full Name"><Inp defaultValue={u.name} /></Field><Field label="Email Address"><ValidInp type="email" defaultValue={u.email} validate="email" /></Field></G>
        <G><Field label="Mobile Number"><ValidInp defaultValue={u.phone} validate="mobile" /></Field><Field label="Training Institute"><Inp defaultValue="SkillBridge Training Institute" /></Field></G>
        <div style={{ textAlign:'right' }}><Btn primary>💾 Save Changes</Btn></div>
      </Card>
      <Card>
        <CardTitle>🔒 Change Password</CardTitle>
        <G><Field label="Current Password"><Inp type="password" placeholder="Current password" /></Field><Field label="New Password"><Inp type="password" placeholder="New password" /></Field></G>
        <Field label="Confirm New Password"><Inp type="password" placeholder="Confirm new password" /></Field>
        <div style={{ textAlign:'right' }}><Btn primary>🔐 Update Password</Btn></div>
      </Card>
      <Card>
        <CardTitle>⚠️ Account Actions</CardTitle>
        <div style={{ display:'flex', gap:12 }}><Btn red>🗑️ Delete Account</Btn><Btn outline onClick={handleLogout}>🚪 Sign Out</Btn></div>
      </Card>
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
      <div style={{ marginLeft:SW, marginTop:TH, padding:24, minHeight:`calc(100vh - ${TH}px)`, overflowX:'hidden', boxSizing:'border-box' }}>
        {renderPanel()}
      </div>
    </div>
  );
}
