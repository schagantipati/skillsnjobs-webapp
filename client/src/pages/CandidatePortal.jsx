import { validate as fieldValidate, UPPERCASE_FIELDS as UPPERCASE_TYPES } from '../utils/validators.js';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  sidebar:'#1A56C4',
  surface:'#F4F6F9', card:'#FFFFFF',
  border:'#E0E6EF', ink:'#1A2B4A', ink2:'#3D5170', ink3:'#6B7FA3',
};
const SW = 220;   // sidebar width
const TH = 58;    // topbar height

/* ─── nav structure ────────────────────────────────────────────── */
const NAV = [
  { section:'Main', items:[
    { id:'dashboard',     icon:'🏠', label:'Dashboard' },
    { id:'notifications', icon:'🔔', label:'Notifications', badge:3 },
  ]},
  { section:'My Profile', items:[
    { id:'profile', icon:'👤', label:'My Profile', children:[
      { id:'profile-basic', label:'Basic Information' },
      { id:'profile-edu',   label:'Education Details' },
      { id:'profile-exp',   label:'Work Experience' },
      { id:'profile-skills',label:'Skills & Competencies' },
      { id:'profile-docs',  label:'Documents & ID Proof' },
      { id:'profile-pref',  label:'Job Preferences' },
    ]},
    { id:'skill-passport', icon:'🏅', label:'Skill Passport', badge:'NEW', badgeBlue:true },
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
    { id:'career', icon:'🚀', label:'Career Services', children:[
      { id:'resume-builder',     label:'Resume Builder' },
      { id:'career-counselling', label:'Career Counselling' },
      { id:'mock-interviews',    label:'Mock Interviews' },
      { id:'career-path',        label:'Career Pathways' },
    ]},
  ]},
  { section:'Schemes & Benefits', items:[
    { id:'schemes', icon:'🏛️', label:'Govt Schemes', children:[
      { id:'pmkvy',      label:'PMKVY 4.0' },
      { id:'naps-scheme',label:'NAPS / NATS' },
      { id:'rpl',        label:'RPL — Prior Learning' },
      { id:'pmegp',      label:'PMEGP / Startup' },
      { id:'scholarship',label:'Scholarships & Stipends' },
    ]},
    { id:'financial-aid', icon:'💰', label:'Financial Assistance' },
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
  const [jobs,        setJobs]      = useState([]);
  const [courses,     setCourses]   = useState([]);
  const [myApps,      setMyApps]    = useState([]);
  const [myEnroll,    setMyEnroll]  = useState([]);
  const [loading,     setLoading]   = useState(true);
  const [applyingId,  setApplyingId]= useState(null);
  const [enrollingId, setEnrollingId]=useState(null);
  const [toast,       setToast]     = useState(null);
  const [searchQ,     setSearchQ]   = useState('');
  const [searchOpen,  setSearchOpen]= useState(false);

  const u        = user || {};
  const fields   = [u.name, u.email, u.phone, u.location, u.bio, u.skills];
  const pct      = Math.round(fields.filter(Boolean).length / fields.length * 100);
  const initials = (u.name || 'CA').split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();

  useEffect(() => {
    (async () => {
      try {
        const [j, c, apps, enroll] = await Promise.allSettled([
          api.jobs(), api.courses(), api.myApplications(), api.myEnrollments(),
        ]);
        if (j.status      === 'fulfilled') setJobs(j.value || []);
        if (c.status      === 'fulfilled') setCourses(c.value || []);
        if (apps.status   === 'fulfilled') setMyApps(apps.value || []);
        if (enroll.status === 'fulfilled') setMyEnroll(enroll.value || []);
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
      toast3('Application submitted!');
    } catch (e) { toast3(e.message, false); }
    finally { setApplyingId(null); }
  }

  async function enrollCourse(id) {
    setEnrollingId(id);
    try {
      await api.enroll(id);
      setMyEnroll(await api.myEnrollments() || []);
      toast3('Enrolled successfully!');
    } catch (e) { toast3(e.message, false); }
    finally { setEnrollingId(null); }
  }

  function go(id) { setActive(id); window.scrollTo(0,0); }
  function toggleMenu(id) { setOpenMenus(m => ({ ...m, [id]: !m[id] })); }
  function signOut() { logout(); navigate('/login'); }

  const appliedIds  = new Set(myApps.map(a => a.job_id));
  const enrolledIds = new Set(myEnroll.map(e => e.course_id));

  /* ── Sidebar ──────────────────────────────────────────────────── */
  function Sidebar() {
    return (
      <aside style={{ width:SW, background:C.sidebar, display:'flex', flexDirection:'column',
        position:'fixed', top:0, left:0, bottom:0, zIndex:200, overflowY:'auto' }}>

        {/* Brand */}
        <div style={{ padding:'14px 16px', borderBottom:'1px solid rgba(255,255,255,.08)',
          display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
          <div style={{ width:36, height:36, borderRadius:8,
            background:'linear-gradient(135deg,#FF6B00,#FFB347)',
            display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>🎓</div>
          <div>
            <div style={{ color:'#fff', fontSize:13, fontWeight:800 }}>SkillsnJobs</div>
            <div style={{ color:'rgba(255,255,255,.45)', fontSize:9.5 }}>Candidate Portal</div>
          </div>
        </div>

        {/* Nav items */}
        <nav style={{ flex:1, padding:'4px 0' }}>
          {NAV.map(sec => (
            <div key={sec.section}>
              <div style={{ fontSize:9.5, fontWeight:700, color:'rgba(255,255,255,.28)',
                letterSpacing:'1px', textTransform:'uppercase', padding:'8px 16px 3px' }}>{sec.section}</div>
              {sec.items.map(item => {
                const hasActiveChild = item.children && item.children.some(c => c.id === active);
                const isActive = active === item.id;
                return (
                  <div key={item.id}>
                    <div onClick={() => item.children ? toggleMenu(item.id) : go(item.id)}
                      style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
                        padding:'7px 14px', margin:'1px 8px', borderRadius:7, cursor:'pointer',
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
                        {item.children && (
                          <span style={{ fontSize:10, color:'rgba(255,255,255,.35)',
                            display:'inline-block', transform: openMenus[item.id] ? 'rotate(180deg)' : 'none',
                            transition:'transform .2s' }}>▾</span>
                        )}
                      </div>
                    </div>
                    {item.children && openMenus[item.id] && (
                      <div>
                        {item.children.map(ch => (
                          <div key={ch.id} onClick={() => go(ch.id)}
                            style={{ display:'flex', alignItems:'center', gap:7,
                              padding:'6px 14px 6px 43px', margin:'1px 8px', borderRadius:6, cursor:'pointer',
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
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding:'10px 14px', borderTop:'1px solid rgba(255,255,255,.07)', flexShrink:0,
          display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <button onClick={() => go('settings')} style={{ display:'flex', alignItems:'center', gap:7,
            background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,.45)',
            fontSize:12, padding:0, fontFamily:'inherit' }}>⚙️ Account Preferences</button>
        </div>
      </aside>
    );
  }

  /* ── Topbar ───────────────────────────────────────────────────── */
  function Topbar() {
    return (
      <div style={{ position:'fixed', top:0, left:SW, right:0, height:TH,
        background:'#fff', borderBottom:`1px solid ${C.border}`, display:'flex',
        alignItems:'center', padding:'0 24px', zIndex:100, gap:14,
        boxShadow:'0 1px 4px rgba(0,51,102,.06)' }}>
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
          <div onClick={() => go('profile-basic')} style={{ display:'flex', alignItems:'center', gap:10,
            padding:'6px 12px', borderRadius:10, background:C.surface, border:`1px solid ${C.border}`,
            cursor:'pointer' }}>
            <div style={{ width:36, height:36, borderRadius:'50%', flexShrink:0,
              background:'linear-gradient(135deg,#FF6B00,#FFB347)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontWeight:800, fontSize:14, color:'#fff',
              border:'2px solid rgba(255,107,0,.3)' }}>{initials}</div>
            <div style={{ textAlign:'left' }}>
              <div style={{ fontSize:13, fontWeight:700, color:C.navy, lineHeight:1.2 }}>{u.name || 'Candidate'}</div>
              <div style={{ fontSize:10, color:C.ink3, marginTop:1 }}>ID: SK-{String(u.id||'0').padStart(6,'0')}</div>
              <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:4 }}>
                <div style={{ width:80, height:4, background:C.border, borderRadius:4, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${pct}%`, background:'linear-gradient(90deg,#FF6B00,#FFB347)', borderRadius:4 }} />
                </div>
                <span style={{ fontSize:10, fontWeight:700, color:C.saffron }}>{pct}%</span>
              </div>
            </div>
          </div>
          <button onClick={signOut} style={{ display:'flex', alignItems:'center', gap:5,
            padding:'10px 18px', borderRadius:7, border:'none',
            background:C.blue, color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer' }}>⏻ Sign Out</button>
        </div>
      </div>
    );
  }

  /* ── Panels (lazy — only the active one evaluates) ────────────── */

  function PanelDashboard() {
    return (
      <div>
        <div style={{ marginBottom:6, fontSize:12, color:C.ink3 }}>🏠 Dashboard</div>
        <div style={{ marginBottom:20 }}>
          <h1 style={{ fontSize:22, fontWeight:800, color:C.navy, margin:0 }}>
            Welcome back, {u.name?.split(' ')[0] || 'there'}! 👋
          </h1>
          <p style={{ color:C.ink3, fontSize:13, marginTop:4 }}>Your personalised skill-to-career dashboard</p>
        </div>

        {pct < 100 && (
          <div style={{ background:'linear-gradient(135deg,#FFF8F0,#FFF3E8)',
            border:'1px solid #FFD4A8', borderRadius:10, padding:'13px 18px',
            marginBottom:18, display:'flex', alignItems:'center', gap:12, fontSize:13 }}>
            <span style={{ fontSize:20 }}>⚡</span>
            <div>
              <strong style={{ color:C.saffronDark }}>Action needed:</strong> Complete your profile to get better job matches.{' '}
              <span onClick={() => go('profile-basic')} style={{ color:C.saffron, fontWeight:700, cursor:'pointer' }}>Complete now →</span>
            </div>
          </div>
        )}

        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:20 }}>
          <KpiCard icon="📚" value={myEnroll.length} label="Enrolled Courses" sub="Active learning" accent={C.saffron} />
          <KpiCard icon="💼" value={myApps.length}   label="Job Applications" sub={`${myApps.filter(a=>a.status==='shortlisted').length} Shortlisted`} accent={C.blue} />
          <KpiCard icon="🏆" value={0}               label="Certificates" sub="Keep going!" accent={C.teal} />
          <KpiCard icon="🏛️" value={3}               label="Govt Schemes" sub="PMKVY Available" accent={C.green} />
        </div>

        {/* Quick actions */}
        <Card style={{ marginBottom:18 }}>
          <CardTitle>⚡ Quick Actions</CardTitle>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
            {[
              ['📚','Find Courses','browse-courses'],['💼','Browse Jobs','browse-jobs'],
              ['🏛️','Apply Scheme','pmkvy'],['📄','Build Resume','resume-builder'],
              ['📝','Assessments','assess-upcoming'],['🔧','Apprenticeship','apprentice-browse'],
              ['🎯','Career Advice','career-counselling'],['🎧','Get Help','helpdesk'],
            ].map(([icon,label,to]) => (
              <div key={to} onClick={() => go(to)} style={{ display:'flex', flexDirection:'column',
                alignItems:'center', gap:8, padding:'14px 10px', borderRadius:10,
                border:`1.5px solid ${C.border}`, cursor:'pointer', textAlign:'center' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor=C.saffron; e.currentTarget.style.background=C.saffronPale; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor=C.border; e.currentTarget.style.background='#fff'; }}>
                <span style={{ fontSize:22 }}>{icon}</span>
                <span style={{ fontSize:11.5, fontWeight:700, color:C.ink2 }}>{label}</span>
              </div>
            ))}
          </div>
        </Card>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18, marginBottom:18 }}>
          {/* Courses */}
          <Card>
            <CardTitle action="View all" onAction={() => go('my-courses')}>📚 My Courses</CardTitle>
            {loading
              ? <p style={{ color:C.ink3, fontSize:13 }}>Loading…</p>
              : myEnroll.length === 0
                ? <div style={{ textAlign:'center', padding:'24px 0' }}>
                    <div style={{ fontSize:28 }}>📚</div>
                    <p style={{ color:C.ink3, fontSize:13, margin:'8px 0 12px' }}>No courses yet</p>
                    <Btn primary sm onClick={() => go('browse-courses')}>Browse Courses</Btn>
                  </div>
                : myEnroll.slice(0,3).map(e => (
                    <div key={e.course_id || e.id} style={{ marginBottom:13 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                        <span style={{ fontSize:12.5, fontWeight:600, color:C.ink }}>{e.title}</span>
                      </div>
                      <ProgBar pct={50} color={C.saffron} />
                      <div style={{ fontSize:11, color:C.ink3, marginTop:3 }}>{e.provider || 'SIDH'}</div>
                    </div>
                  ))
            }
          </Card>
          {/* Applications */}
          <Card>
            <CardTitle action="View all" onAction={() => go('my-applications')}>💼 Recent Applications</CardTitle>
            {loading
              ? <p style={{ color:C.ink3, fontSize:13 }}>Loading…</p>
              : myApps.length === 0
                ? <div style={{ textAlign:'center', padding:'24px 0' }}>
                    <div style={{ fontSize:28 }}>💼</div>
                    <p style={{ color:C.ink3, fontSize:13, margin:'8px 0 12px' }}>No applications yet</p>
                    <Btn primary sm onClick={() => go('browse-jobs')}>Browse Jobs</Btn>
                  </div>
                : myApps.slice(0,4).map(a => (
                    <div key={a.id} style={{ display:'flex', alignItems:'center', padding:'9px 0',
                      borderBottom:`1px solid ${C.border}`, gap:10 }}>
                      <div style={{ width:36, height:36, borderRadius:9, background:C.saffronPale,
                        display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>💼</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:12.5, fontWeight:600, color:C.ink, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.job_title}</div>
                        <div style={{ fontSize:11.5, color:C.ink3 }}>{a.company || a.employer_name || '—'}</div>
                      </div>
                      <StatusTag status={a.status} />
                    </div>
                  ))
            }
          </Card>
        </div>

        {/* Schemes */}
        <Card style={{ marginBottom:18 }}>
          <CardTitle action="Explore all" onAction={() => go('pmkvy')}>🏛️ Government Schemes</CardTitle>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
            {[
              { icon:'🎓', name:'PMKVY 4.0', tag:'Free Training', tc:C.saffron, tp:C.saffronPale, desc:'Industry-aligned skill training with NSQF certification, stipend & placement support.' },
              { icon:'🔧', name:'NAPS Apprenticeship', tag:'Apprenticeship', tc:C.blue, tp:C.bluePale, desc:'Govt bears 25% stipend. Learn on the job with top companies.' },
              { icon:'🏅', name:'Recognition of Prior Learning', tag:'RPL Cert', tc:C.teal, tp:C.tealPale, desc:'Get certified for skills you already have. Cash incentive on certification.' },
            ].map(s => (
              <div key={s.name} onClick={() => go('pmkvy')}
                style={{ border:`1px solid ${C.border}`, borderRadius:9, padding:14, cursor:'pointer' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor=C.saffron; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor=C.border; }}>
                <div style={{ fontSize:26, marginBottom:7 }}>{s.icon}</div>
                <div style={{ fontSize:13, fontWeight:700, color:C.navy, marginBottom:4 }}>{s.name}</div>
                <span style={{ display:'inline-flex', padding:'2px 8px', borderRadius:20, fontSize:10, fontWeight:700, background:s.tp, color:s.tc }}>{s.tag}</span>
                <div style={{ fontSize:11.5, color:C.ink3, marginTop:7, lineHeight:1.5 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardTitle action="View all" onAction={() => go('notifications')}>🔔 Notifications</CardTitle>
          {[
            { dot:true,  text:'Complete your profile to unlock all features and better job matches.' },
            { dot:true,  text:`New jobs matching your profile: ${jobs.length} openings available.` },
            { dot:false, text:'Welcome to SkillsnJobs! Start your skill journey.' },
          ].map((n,i) => (
            <div key={i} style={{ display:'flex', gap:10, padding:'11px 0',
              borderBottom: i<2 ? `1px solid ${C.border}` : 'none' }}>
              <div style={{ width:8, height:8, borderRadius:'50%',
                background: n.dot ? C.saffron : C.border, marginTop:5, flexShrink:0 }} />
              <div style={{ fontSize:12.5, color:C.ink2, lineHeight:1.5 }}>{n.text}</div>
            </div>
          ))}
        </Card>
      </div>
    );
  }

  function PanelBrowseJobs() {
    return (
      <div>
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
                  <thead><tr><Th>Job Title</Th><Th>Company</Th><Th>Location</Th><Th>Salary</Th><Th>Action</Th></tr></thead>
                  <tbody>
                    {jobs.map(j => (
                      <tr key={j.id}>
                        <Td bold><div style={{ fontWeight:700 }}>{j.title}</div><div style={{ fontSize:11, color:C.ink3, fontWeight:400 }}>{j.category || 'General'}</div></Td>
                        <Td>{j.company || j.employer_name || '—'}</Td>
                        <Td>{j.location || '—'}</Td>
                        <Td>{j.salary_min && j.salary_max ? `₹${(j.salary_min/100000).toFixed(1)}–${(j.salary_max/100000).toFixed(1)}L` : j.salary_range || '—'}</Td>
                        <td style={{ padding:'10px 14px', borderBottom:`1px solid ${C.border}` }}>
                          {appliedIds.has(j.id)
                            ? <span style={{ fontSize:11.5, fontWeight:700, color:C.teal }}>✓ Applied</span>
                            : <Btn primary sm onClick={() => applyJob(j.id)}
                                style={{ opacity: applyingId===j.id ? .6 : 1 }}>
                                {applyingId===j.id ? 'Applying…' : 'Apply'}
                              </Btn>
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
        }
      </div>
    );
  }

  function PanelMyApplications() {
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
            : <Card>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                  <thead><tr><Th>Job Title</Th><Th>Company</Th><Th>Applied On</Th><Th>Status</Th></tr></thead>
                  <tbody>
                    {myApps.map(a => (
                      <tr key={a.id}>
                        <Td bold>{a.job_title || '—'}</Td>
                        <Td>{a.company || a.employer_name || '—'}</Td>
                        <Td>{a.applied_at ? new Date(a.applied_at).toLocaleDateString('en-IN') : '—'}</Td>
                        <td style={{ padding:'10px 14px', borderBottom:`1px solid ${C.border}` }}>
                          <StatusTag status={a.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
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
                        : <Btn primary sm onClick={() => enrollCourse(c.id)}
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
                    {myEnroll.map(e => (
                      <tr key={e.course_id || e.id}>
                        <Td bold>{e.title}</Td>
                        <Td>{e.provider || 'SIDH'}</Td>
                        <td style={{ padding:'10px 14px', borderBottom:`1px solid ${C.border}` }}>
                          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                            <div style={{ flex:1 }}><ProgBar pct={50} color={C.saffron} /></div>
                            <span style={{ fontSize:11, fontWeight:700 }}>50%</span>
                          </div>
                        </td>
                        <td style={{ padding:'10px 14px', borderBottom:`1px solid ${C.border}` }}>
                          <span style={{ display:'inline-flex', padding:'3px 8px', borderRadius:20,
                            fontSize:10.5, fontWeight:700, background:C.saffronPale, color:C.saffron }}>In Progress</span>
                        </td>
                        <td style={{ padding:'10px 14px', borderBottom:`1px solid ${C.border}` }}>
                          <Btn primary sm>Continue</Btn>
                        </td>
                      </tr>
                    ))}
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
                  { icon:'⏳', label:'In Progress', value:myEnroll.length, color:C.saffron },
                  { icon:'✅', label:'Completed', value:0, color:C.green },
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
                {myEnroll.map(e => (
                  <div key={e.course_id||e.id} style={{ padding:'14px 0', borderBottom:`1px solid ${C.border}` }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                      <div>
                        <div style={{ fontWeight:700, fontSize:13, color:C.navy }}>{e.title}</div>
                        <div style={{ fontSize:11.5, color:C.ink3, marginTop:2 }}>{e.provider || 'SIDH'} · {e.duration || '—'} hrs</div>
                      </div>
                      <span style={{ fontSize:12, fontWeight:700, color:C.saffron }}>50%</span>
                    </div>
                    <div style={{ height:8, background:C.surface, borderRadius:8, overflow:'hidden' }}>
                      <div style={{ height:'100%', width:'50%', background:`linear-gradient(90deg,${C.saffron},#FFB347)`, borderRadius:8 }} />
                    </div>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:C.ink3, marginTop:5 }}>
                      <span>5 of 10 modules done</span>
                      <span style={{ color:C.saffron, fontWeight:600 }}>In Progress</span>
                    </div>
                  </div>
                ))}
              </Card>
            </>
        }
      </div>
    );
  }

  function PanelCertificates() {
    return (
      <div>
        <div style={{ marginBottom:6, fontSize:12, color:C.ink3 }}>📚 Courses › <span style={{ color:C.saffron }}>My Certificates</span></div>
        <SectionHead title="My Certificates 🏆" />
        <Card>
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
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginTop:18 }}>
          {[
            { icon:'🎓', title:'PMKVY Certificates', desc:'Certificates awarded on completion of PMKVY-funded training programmes.' },
            { icon:'🏅', title:'NSQF Skill Certificates', desc:'National Skills Qualifications Framework certificates by Sector Skill Councils.' },
            { icon:'📄', title:'Course Completion', desc:'Certificates for SkillsnJobs platform courses completed online.' },
            { icon:'🔗', title:'Linked Credentials', desc:'Blockchain-verified digital badges linked to your Skill Passport.' },
          ].map(c => (
            <Card key={c.title}>
              <div style={{ fontSize:28, marginBottom:8 }}>{c.icon}</div>
              <div style={{ fontWeight:700, fontSize:13, color:C.navy, marginBottom:6 }}>{c.title}</div>
              <div style={{ fontSize:12.5, color:C.ink3, lineHeight:1.6 }}>{c.desc}</div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  function PanelAIRecommendations() {
    const recs = courses.slice(0, 3);
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
    return (
      <div>
        <div style={{ marginBottom:6, fontSize:12, color:C.ink3 }}>📝 <span style={{ color:C.saffron }}>Assessments</span></div>
        <SectionHead title="Assessments 📝" />
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18, marginBottom:20 }}>
          <Card>
            <CardTitle>📅 Upcoming Assessments</CardTitle>
            <div style={{ textAlign:'center', padding:'30px 0', color:C.ink3 }}>
              <div style={{ fontSize:36 }}>📅</div>
              <p style={{ marginTop:10, fontSize:13 }}>No upcoming assessments scheduled.</p>
              <Btn primary sm style={{ marginTop:12 }} onClick={() => go('browse-courses')}>Enroll in Courses</Btn>
            </div>
          </Card>
          <Card>
            <CardTitle>✅ Completed Assessments</CardTitle>
            <div style={{ textAlign:'center', padding:'30px 0', color:C.ink3 }}>
              <div style={{ fontSize:36 }}>✅</div>
              <p style={{ marginTop:10, fontSize:13 }}>No assessments completed yet.</p>
            </div>
          </Card>
        </div>
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
          <Btn primary>Apply for RPL Assessment →</Btn>
        </Card>
      </div>
    );
  }

  function PanelSavedJobs() {
    return (
      <div>
        <div style={{ marginBottom:6, fontSize:12, color:C.ink3 }}>💼 Jobs › <span style={{ color:C.saffron }}>Saved Jobs</span></div>
        <SectionHead title="Saved Jobs 🔖" />
        <Card>
          <div style={{ textAlign:'center', padding:'50px 0' }}>
            <div style={{ fontSize:48 }}>🔖</div>
            <div style={{ fontWeight:700, fontSize:16, color:C.navy, marginTop:14 }}>No Saved Jobs</div>
            <p style={{ color:C.ink3, marginTop:8 }}>Bookmark jobs while browsing to review and apply later.</p>
            <div style={{ marginTop:18 }}>
              <Btn primary onClick={() => go('browse-jobs')}>Browse Jobs →</Btn>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  function PanelJobAlerts() {
    return (
      <div>
        <div style={{ marginBottom:6, fontSize:12, color:C.ink3 }}>💼 Jobs › <span style={{ color:C.saffron }}>Job Alerts</span></div>
        <SectionHead title="Job Alerts 🔔" />
        <Card>
          <CardTitle>Set Up Job Alerts</CardTitle>
          <p style={{ fontSize:13, color:C.ink2, lineHeight:1.7, marginBottom:16 }}>
            Get notified via SMS and email when new jobs matching your profile are posted.
          </p>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
            {[
              ['Preferred Job Role','e.g. Data Analyst, Electrician'],
              ['Preferred Sector','e.g. IT, Healthcare, Retail'],
              ['Preferred Location','State / City'],
              ['Alert Frequency','Daily / Weekly'],
            ].map(([l, p]) => (
              <div key={l}>
                <label style={{ fontSize:12, fontWeight:600, color:C.ink2, display:'block', marginBottom:5 }}>{l}</label>
                <input placeholder={p} style={{ width:'100%', padding:'9px 12px', borderRadius:7, fontSize:13, border:`1px solid ${C.border}`, background:'#fff', outline:'none', boxSizing:'border-box' }} />
              </div>
            ))}
          </div>
          <Btn primary>🔔 Activate Job Alerts</Btn>
        </Card>
      </div>
    );
  }

  function PanelPlacementStatus() {
    return (
      <div>
        <div style={{ marginBottom:6, fontSize:12, color:C.ink3 }}>💼 Jobs › <span style={{ color:C.saffron }}>Placement Status</span></div>
        <SectionHead title="Placement Status 📋" />
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginBottom:20 }}>
          {[
            { icon:'📤', label:'Applications Sent', value: myApps.length, color:C.blue },
            { icon:'👀', label:'Shortlisted', value: myApps.filter(a=>a.status==='shortlisted').length, color:C.saffron },
            { icon:'✅', label:'Placed', value: myApps.filter(a=>a.status==='hired').length, color:C.green },
          ].map(k => (
            <div key={k.label} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:'16px 18px' }}>
              <div style={{ fontSize:22, marginBottom:6 }}>{k.icon}</div>
              <div style={{ fontSize:26, fontWeight:800, color:k.color }}>{k.value}</div>
              <div style={{ fontSize:12, color:C.ink3, marginTop:4 }}>{k.label}</div>
            </div>
          ))}
        </div>
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
            <Btn primary sm>Search Apprenticeships</Btn>
          </Card>
          <Card>
            <CardTitle>📝 NAPS Registration</CardTitle>
            <p style={{ fontSize:13, color:C.ink2, lineHeight:1.7, marginBottom:14 }}>Register on the National Apprenticeship Portal (NAPS) to access thousands of opportunities.</p>
            <Btn primary sm>Register on NAPS →</Btn>
          </Card>
        </div>
        <Card>
          <CardTitle>📋 My Applications</CardTitle>
          <div style={{ textAlign:'center', padding:'30px 0', color:C.ink3 }}>
            <div style={{ fontSize:36 }}>📋</div>
            <p style={{ marginTop:10, fontSize:13 }}>No apprenticeship applications yet.</p>
          </div>
        </Card>
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
    return (
      <div>
        <div style={{ marginBottom:6, fontSize:12, color:C.ink3 }}>📣 <span style={{ color:C.saffron }}>Grievance</span></div>
        <SectionHead title="Grievance Redressal 📣" />
        <Card>
          <CardTitle>Submit a Grievance</CardTitle>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
            {[['Category','Training Issue / Job Issue / Technical / Other'],['Subject','Brief subject of the grievance']].map(([l,p]) => (
              <div key={l}>
                <label style={{ fontSize:12, fontWeight:600, color:C.ink2, display:'block', marginBottom:5 }}>{l}</label>
                <input placeholder={p} style={{ width:'100%', padding:'9px 12px', borderRadius:7, fontSize:13, border:`1px solid ${C.border}`, background:'#fff', outline:'none', boxSizing:'border-box' }} />
              </div>
            ))}
          </div>
          <div style={{ marginBottom:16 }}>
            <label style={{ fontSize:12, fontWeight:600, color:C.ink2, display:'block', marginBottom:5 }}>Description</label>
            <textarea placeholder="Describe your grievance in detail…" rows={4} style={{ width:'100%', padding:'9px 12px', borderRadius:7, fontSize:13, border:`1px solid ${C.border}`, resize:'vertical', fontFamily:'inherit', outline:'none', boxSizing:'border-box' }} />
          </div>
          <Btn primary>📤 Submit Grievance</Btn>
        </Card>
        <Card style={{ marginTop:18 }}>
          <CardTitle>📋 My Grievances</CardTitle>
          <div style={{ textAlign:'center', padding:'30px 0', color:C.ink3 }}>
            <p style={{ fontSize:13 }}>No grievances submitted yet.</p>
          </div>
        </Card>
      </div>
    );
  }

  function PanelSkillPassport() {
    const skills = typeof u.skills === 'string' ? u.skills.split(',').filter(Boolean) : Array.isArray(u.skills) ? u.skills : [];
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
                      background:C.tealPale, color:C.teal, border:'1px solid #A8D8CE',
                      borderRadius:20, padding:'4px 11px', fontSize:11.5, fontWeight:600, margin:3 }}>
                      {s.trim()} <span style={{ color:C.green }}>✓</span>
                    </span>
                  ))}
                </div>
            }
          </Card>
          <Card>
            <CardTitle>📋 Profile Information</CardTitle>
            {[['Name',u.name],['Email',u.email],['Phone',u.phone],['Location',u.location]].map(([k,v]) => (
              <div key={k} style={{ display:'flex', gap:10, padding:'6px 0', borderBottom:`1px solid ${C.border}` }}>
                <span style={{ fontSize:12, color:C.ink3, width:80, flexShrink:0 }}>{k}</span>
                <span style={{ fontSize:12.5, color: v ? C.ink : C.ink3, fontStyle: v ? 'normal' : 'italic' }}>{v || 'Not added'}</span>
              </div>
            ))}
            <div style={{ marginTop:14 }}><Btn primary sm onClick={() => navigate('/profile')}>✏️ Edit Profile</Btn></div>
          </Card>
        </div>
        <Card>
          <CardTitle>🏆 Certificates & Credentials</CardTitle>
          <div style={{ textAlign:'center', padding:'30px 0', color:C.ink3 }}>
            <div style={{ fontSize:36 }}>🏆</div>
            <p style={{ marginTop:12 }}>Complete courses to earn certificates.</p>
            <div style={{ marginTop:14 }}><Btn primary sm onClick={() => go('browse-courses')}>Browse Courses →</Btn></div>
          </div>
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
            { icon:'🎓', name:'PMKVY 4.0 — PM Kaushal Vikas Yojana', desc:'Free short-term skill training with NSQF certification, monetary reward & placement support.', btn:'Apply Now' },
            { icon:'🔧', name:'NAPS — National Apprenticeship', desc:'Apprenticeship with industry; govt pays 25% of stipend directly to your account.', btn:'Register' },
            { icon:'🏅', name:'RPL — Recognition of Prior Learning', desc:'Get NSQF certificate for skills you already have. Cash incentive on certification.', btn:'Check Eligibility' },
            { icon:'💰', name:'Scholarships & Stipends', desc:'Monthly stipend during training, post-placement incentive, and merit scholarships.', btn:'View Scholarships' },
          ].map(s => (
            <Card key={s.name}>
              <CardTitle>{s.icon} {s.name}</CardTitle>
              <p style={{ fontSize:13, color:C.ink2, lineHeight:1.7, marginBottom:14 }}>{s.desc}</p>
              <Btn primary sm>{s.btn}</Btn>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  function PanelNotifications() {
    return (
      <div>
        <SectionHead title="Notifications 🔔" />
        <Card>
          {[
            { unread:true, text:'Complete your profile to unlock all features and get better job matches.' },
            { unread:true, text:`${jobs.length} new jobs matching your profile are available.` },
            { unread:false, text:'Welcome to SkillsnJobs! Start your skill-to-career journey.' },
          ].map((n,i) => (
            <div key={i} style={{ display:'flex', gap:10, padding:'13px 0',
              borderBottom: i<2 ? `1px solid ${C.border}` : 'none' }}>
              <div style={{ width:8, height:8, borderRadius:'50%',
                background: n.unread ? C.saffron : C.border, marginTop:5, flexShrink:0 }} />
              <div style={{ fontSize:13, color:C.ink2, lineHeight:1.5 }}>{n.text}</div>
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
    const Inp = ({ placeholder, type='text', value, wide }) => (
      <input type={type} defaultValue={value||''} placeholder={placeholder}
        style={{ width:'100%', padding:'9px 12px', borderRadius:7, fontSize:13,
          border:`1px solid ${C.border}`, background:'#fff', color:C.ink,
          outline:'none', boxSizing:'border-box' }} />
    );
    const Sel = ({ opts, placeholder }) => (
      <select defaultValue="" style={{ width:'100%', padding:'9px 12px', borderRadius:7, fontSize:13,
        border:`1px solid ${C.border}`, background:'#fff', color:C.ink,
        outline:'none', appearance:'none', boxSizing:'border-box' }}>
        <option value="" disabled>{placeholder || 'Select'}</option>
        {opts.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    );
    const Row = ({ children, cols='1fr 1fr' }) => (
      <div style={{ display:'grid', gridTemplateColumns:cols, gap:16, marginBottom:16 }}>{children}</div>
    );
    const Field = ({ label, req, children }) => (
      <div>
        <Lbl req={req}>{label}</Lbl>
        {children}
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
          <Row><Field label="First Name" req><Inp placeholder="Enter first name" value={u.name?.split(' ')[0]} /></Field><Field label="Last Name" req><Inp placeholder="Enter last name" value={u.name?.split(' ').slice(1).join(' ')} /></Field></Row>
          <Row><Field label="Date of Birth" req><Inp type="date" /></Field><Field label="Gender" req><Sel opts={['Male','Female','Transgender','Prefer not to say']} placeholder="Select gender" /></Field></Row>
          <Row><Field label="Mobile Number" req><ValidInp placeholder="10-digit mobile number" value={u.phone} validate="mobile" /></Field><Field label="Email Address" req><ValidInp type="email" placeholder="Email address" value={u.email} validate="email" /></Field></Row>
          <Row><Field label="Aadhaar Number"><ValidInp placeholder="12-digit Aadhaar number" validate="aadhaar" /></Field><Field label="Category" req><Sel opts={['General','SC','ST','OBC','EWS']} placeholder="Select category" /></Field></Row>
          <Row><Field label="Religion"><Sel opts={['Hindu','Muslim','Christian','Sikh','Buddhist','Jain','Others','Prefer not to say']} placeholder="Select religion" /></Field><Field label="Differently Abled"><Sel opts={['No','Yes — Locomotor','Yes — Visual','Yes — Hearing','Yes — Others']} placeholder="Select" /></Field></Row>
          <Row cols="1fr"><Field label="About / Bio"><textarea defaultValue={u.bio||''} placeholder="Write a short bio about yourself, your goals and interests…" rows={3} style={{ width:'100%', padding:'9px 12px', borderRadius:7, fontSize:13, border:`1px solid ${C.border}`, resize:'vertical', fontFamily:'inherit', outline:'none', boxSizing:'border-box' }} /></Field></Row>

          <Divider title="Current Address" />
          <Row cols="1fr"><Field label="Address Line 1" req><Inp placeholder="House/Flat No., Street, Area" /></Field></Row>
          <Row cols="1fr"><Field label="Address Line 2"><Inp placeholder="Landmark, Colony (optional)" /></Field></Row>
          <Row><Field label="State" req><Sel opts={['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Delhi','J&K','Ladakh','Other']} placeholder="Select state" /></Field><Field label="District" req><Inp placeholder="Enter district" /></Field></Row>
          <Row><Field label="City / Town" req><Inp placeholder="Enter city or town" /></Field><Field label="PIN Code" req><ValidInp placeholder="6-digit PIN code" validate="pincode" /></Field></Row>
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
          <Row><Field label="Highest Education Level" req><Sel opts={['8th Pass','10th Pass (Matriculation)','12th Pass (Intermediate)','ITI / Diploma','Graduation (B.A./B.Sc./B.Com)','Graduation (B.Tech/B.E.)','Post Graduation (M.A./M.Sc./M.Com)','Post Graduation (M.Tech/M.E.)','Ph.D / Doctorate','Others']} placeholder="Select highest qualification" /></Field><Field label="Specialisation / Stream"><Inp placeholder="e.g. Science, Commerce, Computer Science" /></Field></Row>
          <Row><Field label="Board / University / Institute" req><Inp placeholder="Name of board or university" /></Field><Field label="Year of Passing" req><Sel opts={Array.from({length:40},(_,i)=>String(2024-i))} placeholder="Select year" /></Field></Row>
          <Row><Field label="Marks / Percentage / CGPA"><Inp placeholder="e.g. 75% or 8.2 CGPA" /></Field><Field label="Grade / Division"><Sel opts={['First Class / Distinction (≥60%)','Second Class (50-59%)','Pass Class (35-49%)','CGPA / Grade System']} placeholder="Select grade" /></Field></Row>
          <Row cols="1fr"><Field label="Institute Name" req><Inp placeholder="Name of school, college or institute" /></Field></Row>
          <Row><Field label="State of Institute"><Sel opts={['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Delhi','J&K','Ladakh','Other']} placeholder="Select state" /></Field><Field label="District of Institute"><Inp placeholder="Enter district" /></Field></Row>

          <Divider title="Additional Qualifications" />
          <Row><Field label="Other Certifications / Diplomas"><Inp placeholder="e.g. Tally, AutoCAD, Spoken English (comma separated)" /></Field><Field label="Year Obtained"><Inp placeholder="Year" /></Field></Row>
          <div style={{ padding:'12px 16px', background:C.bluePale, border:`1px solid #C5D9F5`, borderRadius:8, fontSize:12.5, color:C.blue, marginBottom:16 }}>
            ℹ️ Upload supporting education documents in the <strong>Documents</strong> section.
          </div>
        </div>
      );

      /* ── Work Experience ── */
      if (active === 'profile-exp') return (
        <div>
          <Divider title="Employment Status" />
          <Row><Field label="Current Employment Status" req><Sel opts={['Fresher / Never Employed','Currently Employed','Self Employed / Freelance','Unemployed (Previously Employed)','Apprentice / Trainee']} placeholder="Select status" /></Field><Field label="Total Work Experience"><Sel opts={['No Experience','Less than 6 months','6 months – 1 year','1 – 2 years','2 – 5 years','5 – 10 years','More than 10 years']} placeholder="Select experience" /></Field></Row>

          <Divider title="Current / Last Employer" />
          <Row><Field label="Organisation Name"><Inp placeholder="Company / employer name" /></Field><Field label="Designation / Job Title"><Inp placeholder="e.g. Sales Executive, Lab Technician" /></Field></Row>
          <Row><Field label="Sector / Industry" req><Sel opts={['Agriculture','Automotive','BFSI (Banking/Finance/Insurance)','Construction','Domestic Worker','Electronics','Food Processing','Gems & Jewellery','Green Jobs','Healthcare','Hospitality','IT / ITeS','Leather','Logistics','Manufacturing','Media & Entertainment','Mining','Plumbing','Retail','Security','Telecom','Textile','Tourism','Others']} placeholder="Select sector" /></Field><Field label="Nature of Employment"><Sel opts={['Permanent / Regular','Contract / Temporary','Part-time','Apprenticeship','Self-employed','Daily Wage']} placeholder="Select type" /></Field></Row>
          <Row><Field label="Date of Joining"><Inp type="date" /></Field><Field label="Date of Leaving (if applicable)"><Inp type="date" /></Field></Row>
          <Row cols="1fr"><Field label="Key Responsibilities / Role Description"><textarea placeholder="Briefly describe your key responsibilities and achievements…" rows={3} style={{ width:'100%', padding:'9px 12px', borderRadius:7, fontSize:13, border:`1px solid ${C.border}`, resize:'vertical', fontFamily:'inherit', outline:'none', boxSizing:'border-box' }} /></Field></Row>
          <Row><Field label="Last Monthly Salary (₹)"><Inp placeholder="e.g. 15000" /></Field><Field label="Reason for Leaving"><Sel opts={['Better Opportunity','Career Growth','Relocation','Health Reasons','Company Closure','Contract End','Others']} placeholder="Select reason" /></Field></Row>
          <div style={{ textAlign:'right', marginBottom:16 }}>
            <Btn sm style={{ borderColor:C.saffron, color:C.saffron }}>+ Add Another Experience</Btn>
          </div>
        </div>
      );

      /* ── Skills ── */
      if (active === 'profile-skills') return (
        <div>
          <Divider title="Technical Skills" />
          <Row><Field label="Skill Category" req><Sel opts={['Agriculture & Allied','Apparel, Madeups & Home Furnishing','Automotive','Beauty & Wellness','BFSI','Capital Goods','Construction','Domestic Worker','Electronics & Hardware','Food Processing','Furniture & Fittings','Green Jobs & Sustainability','Gems & Jewellery','Healthcare','Hospitality & Tourism','IT & ITeS','Leather','Logistics','Media & Entertainment','Mining','Plumbing','Retail','Rubber','Security','Sporticulture','Telecom','Textile','Others']} placeholder="Select skill sector" /></Field><Field label="Specific Skill / Trade" req><Inp placeholder="e.g. Python Programming, Electrician, Beautician" /></Field></Row>
          <Row><Field label="Proficiency Level" req><Sel opts={['Beginner (Basic awareness)','Elementary (Can do with guidance)','Intermediate (Can work independently)','Advanced (Can train others)','Expert (Specialised knowledge)']} placeholder="Select proficiency" /></Field><Field label="Years of Experience with Skill"><Sel opts={['Less than 1 year','1 – 2 years','2 – 5 years','More than 5 years']} placeholder="Select" /></Field></Row>
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
      if (active === 'profile-docs') return (
        <div>
          <div style={{ padding:'12px 16px', background:'#FEF3C7', border:'1px solid #FDE68A', borderRadius:8, fontSize:12.5, color:'#9A6A00', marginBottom:18 }}>
            ⚠️ Upload clear scanned copies or photos. Accepted formats: PDF, JPG, PNG. Max size: 2 MB per document.
          </div>
          <Divider title="Identity Documents" />
          {[
            { label:'Aadhaar Card', req:true,  hint:'Front & Back pages' },
            { label:'PAN Card',     req:false, hint:'Optional — required for certain schemes' },
            { label:'Voter ID',     req:false, hint:'Optional' },
            { label:'Passport',     req:false, hint:'Optional' },
          ].map(d => (
            <div key={d.label} style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
              padding:'12px 16px', border:`1px solid ${C.border}`, borderRadius:9, marginBottom:10, background:'#fff' }}>
              <div>
                <div style={{ fontWeight:600, fontSize:13, color:C.ink }}>{d.label}{d.req && <span style={{ color:'#DC2626', marginLeft:3 }}>*</span>}</div>
                <div style={{ fontSize:11.5, color:C.ink3, marginTop:2 }}>{d.hint}</div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ fontSize:11, color:C.ink3 }}>No file chosen</span>
                <label style={{ padding:'6px 14px', borderRadius:7, background:C.blue, color:'#fff',
                  fontSize:12, fontWeight:700, cursor:'pointer' }}>
                  📎 Upload
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display:'none' }} />
                </label>
              </div>
            </div>
          ))}

          <Divider title="Education Documents" />
          {[
            { label:'10th Marksheet / Certificate', req:true },
            { label:'12th Marksheet / Certificate', req:false },
            { label:'Graduation / Degree Certificate', req:false },
            { label:'Other Qualification Certificate', req:false },
          ].map(d => (
            <div key={d.label} style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
              padding:'12px 16px', border:`1px solid ${C.border}`, borderRadius:9, marginBottom:10, background:'#fff' }}>
              <div style={{ fontWeight:600, fontSize:13, color:C.ink }}>{d.label}{d.req && <span style={{ color:'#DC2626', marginLeft:3 }}>*</span>}</div>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ fontSize:11, color:C.ink3 }}>No file chosen</span>
                <label style={{ padding:'6px 14px', borderRadius:7, background:C.blue, color:'#fff',
                  fontSize:12, fontWeight:700, cursor:'pointer' }}>
                  📎 Upload
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display:'none' }} />
                </label>
              </div>
            </div>
          ))}

          <Divider title="Skill / Training Certificates" />
          {[
            { label:'Skill Training Certificate (NSQF)', req:false },
            { label:'Apprenticeship Completion Certificate', req:false },
            { label:'Other Skill / IT Certificates', req:false },
          ].map(d => (
            <div key={d.label} style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
              padding:'12px 16px', border:`1px solid ${C.border}`, borderRadius:9, marginBottom:10, background:'#fff' }}>
              <div style={{ fontWeight:600, fontSize:13, color:C.ink }}>{d.label}</div>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ fontSize:11, color:C.ink3 }}>No file chosen</span>
                <label style={{ padding:'6px 14px', borderRadius:7, background:C.blue, color:'#fff',
                  fontSize:12, fontWeight:700, cursor:'pointer' }}>
                  📎 Upload
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display:'none' }} />
                </label>
              </div>
            </div>
          ))}

          <Divider title="Bank / Financial Details (for scheme benefits)" />
          <Row><Field label="Bank Account Number"><Inp placeholder="Enter account number" /></Field><Field label="Confirm Account Number"><Inp placeholder="Re-enter account number" /></Field></Row>
          <Row><Field label="IFSC Code"><ValidInp placeholder="e.g. SBIN0001234" validate="ifsc" /></Field><Field label="Bank Name"><Inp placeholder="Name of bank" /></Field></Row>
          <Row cols="1fr"><Field label="Branch Name & Address"><Inp placeholder="Branch name and city" /></Field></Row>
          <Row><Field label="Passbook / Cancelled Cheque"><div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontSize:11, color:C.ink3 }}>No file chosen</span>
            <label style={{ padding:'6px 14px', borderRadius:7, background:C.blue, color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer' }}>
              📎 Upload<input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display:'none' }} />
            </label>
          </div></Field></Row>
        </div>
      );

      /* ── Job Preferences ── */
      if (active === 'profile-pref') return (
        <div>
          <Divider title="Job / Work Preferences" />
          <Row><Field label="Preferred Job Role / Designation" req><Inp placeholder="e.g. Data Analyst, Electrician, Sales Executive" /></Field><Field label="Preferred Employment Type" req><Sel opts={['Full-time','Part-time','Contract / Project','Freelance / Consultancy','Apprenticeship','Internship','Any']} placeholder="Select type" /></Field></Row>
          <Row><Field label="Expected Monthly Salary (₹)" req><Inp placeholder="e.g. 20000" /></Field><Field label="Notice Period"><Sel opts={['Immediately Available','15 Days','1 Month','2 Months','3 Months','More than 3 Months']} placeholder="Select notice period" /></Field></Row>
          <Row><Field label="Preferred Sector" req><Sel opts={['Agriculture','Automotive','BFSI','Construction','Electronics','Food Processing','Healthcare','Hospitality','IT / ITeS','Logistics','Manufacturing','Media','Retail','Security','Telecom','Textile','Others']} placeholder="Select sector" /></Field><Field label="Preferred Work Mode"><Sel opts={['On-site / Office','Work from Home','Hybrid','Open to Any']} placeholder="Select work mode" /></Field></Row>

          <Divider title="Preferred Location" />
          <Row><Field label="Preferred State" req><Sel opts={['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Delhi','J&K','Ladakh','Open to Relocation']} placeholder="Select preferred state" /></Field><Field label="Preferred City / District"><Inp placeholder="Enter preferred city or district" /></Field></Row>
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

          {/* Action buttons */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
            marginTop:24, paddingTop:16, borderTop:`1px solid ${C.border}` }}>
            <Btn onClick={() => cur > 0 && go(STEPS[cur-1].id)}
              style={{ opacity: cur===0 ? .4 : 1, pointerEvents: cur===0 ? 'none':'auto' }}>
              ← Previous
            </Btn>
            <div style={{ display:'flex', gap:10 }}>
              <Btn style={{ borderColor:C.teal, color:C.teal }}>💾 Save Draft</Btn>
              {cur < STEPS.length-1
                ? <Btn primary onClick={() => go(STEPS[cur+1].id)}>Save & Continue →</Btn>
                : <Btn primary style={{ background:C.blue }}>✅ Submit Profile</Btn>
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

  function PanelSettings() {
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
      case 'apprentice-browse':
      case 'apprentice-applied':
      case 'naps':             return PanelApprenticeship();
      case 'resume-builder':
      case 'career-counselling':
      case 'mock-interviews':
      case 'career-path':
      case 'career':           return PanelCareerServices();
      case 'financial-aid':    return PanelFinancialAid();
      case 'grievance':        return PanelGrievance();
      case 'settings':         return PanelSettings();
      case 'skill-passport':   return PanelSkillPassport();
      case 'pmkvy':
      case 'naps-scheme':
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
      <div style={{ marginLeft:SW, flex:1, display:'flex', flexDirection:'column', background:C.surface }}>
        {Topbar()}
        <div style={{ marginTop:TH, flex:1, padding:'24px 28px 60px' }}>
          {renderPanel()}
        </div>
      </div>
      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed', bottom:50, right:24, zIndex:9999,
          background: toast.ok ? C.teal : '#DC2626', color:'#fff',
          padding:'12px 20px', borderRadius:10, fontSize:13, fontWeight:600,
          boxShadow:'0 4px 20px rgba(0,0,0,.25)', display:'flex', alignItems:'center', gap:8 }}>
          {toast.ok ? '✅' : '❌'} {toast.msg}
        </div>
      )}
    </div>
  );
}
