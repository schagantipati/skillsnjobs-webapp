import { validate as fieldValidate, UPPERCASE_FIELDS as UPPERCASE_TYPES } from '../utils/validators.js';
import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

const SW = 252, TH = 58;
const C = {
  navy:'#0D2137', sidebar:'#1A56C4', blue:'#1E5FBF', teal:'#0B7B8C', green:'#1A7C3E',
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
function Sel({ options, defaultValue }) {
  return <select defaultValue={defaultValue} style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #dde2eb', borderRadius:8, fontSize:13.5, outline:'none', background:'#fafbfc', fontFamily:'inherit' }}>
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
  const searchRef = useRef(null);

  function toggleMenu(id) { setOpenMenus(m => ({ ...m, [id]: !m[id] })); }
  function go(key) { setPanel(key); window.scrollTo(0,0); }
  function handleLogout() { logout(); navigate('/login'); }

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
      <div style={{ position:'fixed', top:0, left:0, width:SW, height:'100vh', background:C.sidebar, overflowY:'auto', zIndex:200, display:'flex', flexDirection:'column' }}>
        <div style={{ padding:'0 16px', height:TH, display:'flex', alignItems:'center', gap:10, borderBottom:'1px solid rgba(255,255,255,.1)', flexShrink:0 }}>
          <div style={{ width:34, height:34, background:C.blue, borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>💼</div>
          <div>
            <div style={{ color:'#fff', fontWeight:800, fontSize:14, lineHeight:1.2 }}>SkillsNJobs</div>
            <div style={{ color:'rgba(255,255,255,.45)', fontSize:9.5 }}>EMPLOYER PORTAL</div>
          </div>
        </div>

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
            🔔<span style={{ position:'absolute', top:2, right:2, width:17, height:17, borderRadius:'50%', background:C.red, color:'#fff', fontSize:10, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center' }}>4</span>
          </div>
          <div style={{ width:38, height:38, borderRadius:'50%', background:C.blue, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:14 }}>TN</div>
          <div style={{ lineHeight:1.25 }}>
            <div style={{ fontWeight:700, fontSize:13.5 }}>{user?.org_name || 'TechNova Pvt Ltd'}</div>
            <div style={{ fontSize:11.5, color:'#64748b' }}>ID: EMP-000012</div>
          </div>
          <button onClick={handleLogout} style={{ background:C.blue, color:'#fff', border:'none', padding:'7px 16px', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer' }}>⏻ Sign Out</button>
        </div>
      </div>
    );
  }

  // ── PANELS ────────────────────────────────────────────────────────────────
  function PanelDashboard() {
    return <>
      <Alert icon="⚡" type="warn"><strong>Action required:</strong> 3 job applications are awaiting your review. <strong>Review Now →</strong></Alert>
      <SectionHead title={`Welcome, ${user?.org_name || 'TechNova Pvt Ltd'}! 💼`} />
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:20 }}>
        <KpiCard val="18" label="Active Job Postings" sub="Across 6 locations" color={C.blue} />
        <KpiCard val="342" label="Total Applications" sub="This month" color={C.teal} />
        <KpiCard val="47" label="Candidates Shortlisted" sub="Pending interview" color={C.green} />
        <KpiCard val="12" label="Hires This Month" sub="84% offer acceptance" color={C.gold} />
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
          <CardTitle>📊 Hiring Funnel — This Month</CardTitle>
          <StatRow n="342" label="Applications Received" pct={100} color={C.blue} />
          <StatRow n="210" label="Screened" pct={61} color={C.teal} />
          <StatRow n="98"  label="Shortlisted" pct={29} color={C.green} />
          <StatRow n="47"  label="Interview Scheduled" pct={14} color={C.gold} />
          <StatRow n="12"  label="Offers Extended" pct={4}  color={C.purple} />
        </Card>
        <Card style={{ marginBottom:0 }}>
          <CardTitle>🏆 Top Active Jobs</CardTitle>
          <Table head={['Job Title','Applications','Status']} rows={[
            ['Senior React Developer','48',<Badge color="green">Active</Badge>],
            ['Data Analyst','37',<Badge color="green">Active</Badge>],
            ['QA Engineer','29',<Badge color="blue">Active</Badge>],
            ['Product Manager','55',<Badge color="teal">Active</Badge>],
            ['DevOps Engineer','21',<Badge color="gold">Closing</Badge>],
          ]} />
        </Card>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        <Card style={{ marginBottom:0 }}>
          <CardTitle>🔔 Recent Activity</CardTitle>
          <TlItem dot={C.green} title="Priya Verma accepted offer for Senior React Developer" meta="Today · 11:30 AM" />
          <TlItem dot={C.blue}  title="34 new applications for Data Analyst role" meta="Today · 9:00 AM" />
          <TlItem dot={C.gold}  title="Interview scheduled: Rahul Kumar — Product Manager" meta="Yesterday · 4:30 PM" />
          <TlItem dot={C.purple} title="NAPS apprenticeship batch of 15 approved" meta="Jul 3, 2026" />
          <TlItem dot={C.teal}  title="Skill Gap Analysis report generated" meta="Jul 2, 2026" />
        </Card>
        <Card style={{ marginBottom:0 }}>
          <CardTitle>👥 Recent Applications</CardTitle>
          <Table head={['Candidate','Role','Match','Status']} rows={[
            ['Aisha Khan','Data Analyst','⭐ 92%',<Badge color="blue">New</Badge>],
            ['Rahul Verma','React Developer','⭐ 87%',<Badge color="green">Shortlisted</Badge>],
            ['Sneha Iyer','QA Engineer','⭐ 79%',<Badge color="teal">Interview</Badge>],
            ['Amit Sharma','DevOps Eng.','⭐ 83%',<Badge color="gold">Review</Badge>],
          ]} />
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
          [C.gold,'⚠️ 3 applications pending review for Data Analyst','System · 2 hours ago'],
          [C.green,'✅ Priya Verma accepted your offer — Senior React Developer','Today · 11:30 AM'],
          [C.blue,'📋 34 new applications received for Data Analyst role','Today · 9:00 AM'],
          [C.teal,'🎓 NAPS batch of 15 apprentices approved by MSDE','Jul 3, 2026'],
          [C.purple,'📊 Skill Gap Analysis report is ready to download','Jul 3, 2026'],
          [C.red,'⚠️ Job posting "DevOps Engineer" expiring in 3 days','Jul 2, 2026'],
        ].map(([c,t,m])=><TlItem key={t} dot={c} title={t} meta={m} />)}
      </Card>
    </>;
  }

  function PanelProfileInfo() {
    return <>
      <Bc parts={['Company Profile','Company Information']} />
      <SectionHead title="Company Information 🏢" />
      <Card>
        <CardTitle>🏛️ Basic Details</CardTitle>
        <Grid><Field label="Company Name"><Inp defaultValue="TechNova Pvt Ltd" /></Field><Field label="CIN Number"><ValidInp defaultValue="U72200KA2015PTC082341" validate="cin" /></Field></Grid>
        <Grid cols={3}><Field label="Company Type"><Sel options={['Private Limited','Public Limited','LLP','Proprietorship']} defaultValue="Private Limited" /></Field><Field label="Industry Sector"><Sel options={['Information Technology','Manufacturing','Healthcare','BFSI','Retail']} defaultValue="Information Technology" /></Field><Field label="Year Founded"><Inp defaultValue="2015" /></Field></Grid>
        <Grid><Field label="PAN Number"><ValidInp defaultValue="AAACT1234A" validate="pan" /></Field><Field label="GSTIN"><ValidInp defaultValue="29AAACT1234A1ZK" validate="gst" /></Field></Grid>
        <Field label="Company Description"><textarea className="inp" rows={3} defaultValue="Mid-size product company building cloud-native enterprise solutions for B2B clients across India and SEA." style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #dde2eb', borderRadius:8, fontSize:13.5, outline:'none', background:'#fafbfc', fontFamily:'inherit' }} /></Field>
        <div style={{ textAlign:'right' }}><Btn>💾 Save Changes</Btn></div>
      </Card>
      <Card>
        <CardTitle>📊 Workforce Overview</CardTitle>
        <Grid cols={3}><Field label="Total Employees"><Inp defaultValue="420" /></Field><Field label="Open Positions"><Inp defaultValue="18" /></Field><Field label="Annual Hiring Target"><Inp defaultValue="60" /></Field></Grid>
        <Alert icon="ℹ️" type="info">Keep your workforce numbers updated for accurate scheme eligibility and Skill India matching.</Alert>
      </Card>
    </>;
  }

  function PanelProfileContact() {
    return <>
      <Bc parts={['Company Profile','Contact & Address']} />
      <SectionHead title="Contact & Address 📍" />
      <Card>
        <CardTitle>🏢 Registered Office</CardTitle>
        <Field label="Street Address"><Inp defaultValue="#42, 3rd Floor, Outer Ring Road, Marathahalli" /></Field>
        <Grid cols={3}><Field label="City"><Inp defaultValue="Bengaluru" /></Field><Field label="State"><Sel options={['Karnataka','Maharashtra','Delhi','Tamil Nadu']} defaultValue="Karnataka" /></Field><Field label="PIN Code"><ValidInp defaultValue="560037" validate="pincode" /></Field></Grid>
        <Grid><Field label="HR Email"><ValidInp defaultValue="hr@technova.com" validate="email" /></Field><Field label="HR Helpline"><ValidInp defaultValue="080-4567-8900" validate="phone" /></Field></Grid>
        <div style={{ textAlign:'right' }}><Btn>💾 Save Changes</Btn></div>
      </Card>
      <Card>
        <CardTitle>👤 Primary HR Contact</CardTitle>
        <Grid><Field label="HR Manager Name"><Inp defaultValue="Kavitha Reddy" /></Field><Field label="Designation"><Inp defaultValue="Head of Talent Acquisition" /></Field></Grid>
        <Grid><Field label="Mobile"><ValidInp defaultValue="9876543210" validate="mobile" /></Field><Field label="Email"><ValidInp defaultValue="kavitha.reddy@technova.com" validate="email" /></Field></Grid>
        <div style={{ textAlign:'right' }}><Btn>💾 Update Contact</Btn></div>
      </Card>
    </>;
  }

  function PanelProfileDocs() {
    return <>
      <Bc parts={['Company Profile','Company Documents']} />
      <SectionHead title="Company Documents 📄" />
      <Card>
        <Table head={['Document','Uploaded On','Status','Action']} rows={[
          ['Certificate of Incorporation','Mar 10, 2015',<Badge color="green">Verified</Badge>,<Btn sm outline>Download</Btn>],
          ['GST Certificate','Apr 1, 2025',<Badge color="green">Verified</Badge>,<Btn sm outline>Download</Btn>],
          ['PAN Card','Mar 15, 2015',<Badge color="teal">Verified</Badge>,<Btn sm outline>Download</Btn>],
          ['MSME Registration','Jun 5, 2021',<Badge color="green">Verified</Badge>,<Btn sm outline>Download</Btn>],
          ['Shop & Establishments Act','Jan 10, 2024',<Badge color="gold">Under Review</Badge>,<Btn sm outline>Download</Btn>],
        ]} />
        <div style={{ marginTop:14 }}><Btn>📤 Upload New Document</Btn></div>
      </Card>
    </>;
  }

  function PanelProfileBank() {
    return <>
      <Bc parts={['Company Profile','Bank & Billing']} />
      <SectionHead title="Bank & Billing 🏦" />
      <Card>
        <Grid><Field label="Account Holder"><Inp defaultValue="TechNova Pvt Ltd" /></Field><Field label="Account Number"><Inp defaultValue="XXXX-XXXX-XXXX-5678" /></Field></Grid>
        <Grid cols={3}><Field label="IFSC Code"><ValidInp defaultValue="ICIC0001234" validate="ifsc" /></Field><Field label="Bank Name"><Inp defaultValue="ICICI Bank" /></Field><Field label="Account Type"><Sel options={['Current','Savings']} defaultValue="Current" /></Field></Grid>
        <Alert icon="⚠️" type="warn">Bank details require OTP verification and admin approval before changes take effect.</Alert>
        <div style={{ textAlign:'right' }}><Btn>💾 Save & Verify</Btn></div>
      </Card>
    </>;
  }

  function PanelProfileHr() {
    return <>
      <Bc parts={['Company Profile','HR Contacts']} />
      <SectionHead title="HR Contacts 👤" />
      <Card>
        <Table head={['Name','Designation','Email','Mobile','Access']} rows={[
          ['Kavitha Reddy','Head of TA','kavitha@technova.com','9876543210',<Badge color="blue">Admin</Badge>],
          ['Arjun Nair','Recruiter','arjun@technova.com','9876543211',<Badge color="teal">Standard</Badge>],
          ['Shalini Mehta','HR BP','shalini@technova.com','9876543212',<Badge color="teal">Standard</Badge>],
        ]} />
        <div style={{ marginTop:14 }}><Btn>+ Add HR Contact</Btn></div>
      </Card>
    </>;
  }

  function PanelJobPost() {
    return <>
      <Bc parts={['Job Management','Post New Job']} />
      <SectionHead title="Post New Job 📋" />
      <Card>
        <CardTitle>📝 Job Details</CardTitle>
        <Field label="Job Title"><Inp placeholder="e.g. Senior Frontend Developer" /></Field>
        <Grid cols={3}><Field label="Department"><Sel options={['Engineering','Product','Design','Sales','Marketing','HR','Finance']} /></Field><Field label="Employment Type"><Sel options={['Full-time','Part-time','Contract','Internship','Apprenticeship']} /></Field><Field label="Work Mode"><Sel options={['On-site','Remote','Hybrid']} /></Field></Grid>
        <Grid cols={3}><Field label="Location(s)"><Inp placeholder="e.g. Bengaluru, Remote" /></Field><Field label="Min Experience"><Sel options={['Fresher','1-2 Years','2-5 Years','5-8 Years','8+ Years']} /></Field><Field label="Min Education"><Sel options={['10th Pass','12th Pass','Diploma','Graduate','Post-Graduate']} /></Field></Grid>
        <Field label="Job Description"><textarea className="inp" rows={5} placeholder="Describe roles, responsibilities…" style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #dde2eb', borderRadius:8, fontSize:13.5, outline:'none', background:'#fafbfc', fontFamily:'inherit' }} /></Field>
        <Field label="Required Skills"><Inp placeholder="e.g. React, Node.js, SQL (comma separated)" /></Field>
      </Card>
      <Card>
        <CardTitle>💰 Compensation</CardTitle>
        <Grid cols={3}><Field label="Min Salary (₹/year)"><Inp defaultValue="500000" /></Field><Field label="Max Salary (₹/year)"><Inp defaultValue="800000" /></Field><Field label="Salary Frequency"><Sel options={['Per Annum','Per Month']} /></Field></Grid>
        <Field label="Additional Benefits"><Inp placeholder="e.g. Health insurance, ESOPs, Remote allowance" /></Field>
        <Grid><Field label="Application Deadline"><Inp type="date" /></Field><Field label="Number of Openings"><Inp defaultValue="3" /></Field></Grid>
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}><Btn outline>Save Draft</Btn><Btn green>🚀 Publish Job</Btn></div>
      </Card>
    </>;
  }

  function PanelJobActive() {
    return <>
      <Bc parts={['Job Management','Active Jobs']} />
      <SectionHead title="Active Jobs 🚀" />
      <Card>
        <Table head={['Job Title','Location','Posted','Applications','Status','Action']} rows={[
          ['Senior React Developer','Bengaluru','Jun 15','48 (+5 today)',<Badge color="green">Active</Badge>,<Btn sm outline>View</Btn>],
          ['Data Analyst','Hyderabad','Jun 18','37',<Badge color="green">Active</Badge>,<Btn sm outline>View</Btn>],
          ['QA Engineer','Pune','Jun 20','29',<Badge color="blue">Active</Badge>,<Btn sm outline>View</Btn>],
          ['Product Manager','Remote','Jun 25','55',<Badge color="teal">Active</Badge>,<Btn sm outline>View</Btn>],
          ['DevOps Engineer','Chennai','Jun 28','21',<Badge color="gold">Closing</Badge>,<Btn sm outline>Extend</Btn>],
          ['UI/UX Designer','Bengaluru','Jul 1','16',<Badge color="green">Active</Badge>,<Btn sm outline>View</Btn>],
        ]} />
        <div style={{ marginTop:14 }}><Btn>+ Post New Job</Btn></div>
      </Card>
    </>;
  }

  function PanelJobDraft() {
    return <>
      <Bc parts={['Job Management','Draft Jobs']} />
      <SectionHead title="Draft Jobs 📝" />
      <Card>
        <Table head={['Job Title','Department','Last Edited','Action']} rows={[
          ['ML Engineer','Engineering','Jul 3, 2026',<><Btn sm outline>Edit</Btn>{' '}<Btn sm green>Publish</Btn></>],
          ['Sales Executive','Sales','Jul 1, 2026',<><Btn sm outline>Edit</Btn>{' '}<Btn sm green>Publish</Btn></>],
          ['Business Analyst','Product','Jun 28, 2026',<><Btn sm outline>Edit</Btn>{' '}<Btn sm green>Publish</Btn></>],
        ]} />
        <div style={{ marginTop:14 }}><Btn>+ Create New Draft</Btn></div>
      </Card>
    </>;
  }

  function PanelJobClosed() {
    return <>
      <Bc parts={['Job Management','Closed Jobs']} />
      <SectionHead title="Closed Jobs ✅" />
      <Card>
        <Table head={['Job Title','Closed On','Applications','Hires','Outcome']} rows={[
          ['Backend Developer','Mar 31, 2026','62','3',<Badge color="green">Filled</Badge>],
          ['Data Scientist','Feb 28, 2026','48','1',<Badge color="green">Filled</Badge>],
          ['Support Engineer','Jan 15, 2026','30','2',<Badge color="teal">Filled</Badge>],
          ['Content Writer','Dec 20, 2025','25','0',<Badge color="red">Cancelled</Badge>],
        ]} />
      </Card>
    </>;
  }

  function PanelJobApplications() {
    return <>
      <Bc parts={['Job Management','All Applications']} />
      <SectionHead title="All Applications 📬" />
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:20 }}>
        <KpiCard val="342" label="Total Applications" sub="This month" color={C.blue} />
        <KpiCard val="210" label="Screened" sub="61% of total" color={C.teal} />
        <KpiCard val="47"  label="Shortlisted" sub="14% of total" color={C.green} />
        <KpiCard val="12"  label="Offers Extended" sub="4% of total" color={C.gold} />
      </div>
      <Card>
        <Table head={['Candidate','Job Applied','Applied On','Match','Status','Action']} rows={[
          ['Aisha Khan','Data Analyst','Jul 4','⭐ 92%',<Badge color="blue">New</Badge>,<Btn sm outline>Review</Btn>],
          ['Rahul Verma','React Developer','Jul 4','⭐ 87%',<Badge color="green">Shortlisted</Badge>,<Btn sm outline>Schedule</Btn>],
          ['Sneha Iyer','QA Engineer','Jul 3','⭐ 79%',<Badge color="teal">Interview</Badge>,<Btn sm outline>View</Btn>],
          ['Amit Sharma','DevOps Eng.','Jul 3','⭐ 83%',<Badge color="gold">Under Review</Badge>,<Btn sm outline>Review</Btn>],
          ['Priya Verma','React Developer','Jul 1','⭐ 91%',<Badge color="green">Offer Accepted</Badge>,<Btn sm outline>View</Btn>],
        ]} />
      </Card>
    </>;
  }

  function PanelCandSearch() {
    return <>
      <Bc parts={['Candidates','Search Candidates']} />
      <SectionHead title="Search Candidates 🔍" />
      <Card>
        <CardTitle>🔍 Filter & Search</CardTitle>
        <Grid cols={3}><Field label="Skill / Trade"><Inp placeholder="e.g. React, Python, Welding" /></Field><Field label="Location"><Sel options={['All India','Bengaluru','Hyderabad','Mumbai','Delhi','Pune','Chennai']} /></Field><Field label="Experience"><Sel options={['Any','Fresher','1-2 Years','2-5 Years','5+ Years']} /></Field></Grid>
        <Grid cols={3}><Field label="Education"><Sel options={['Any','10th Pass','12th Pass','Diploma','Graduate','Post-Graduate']} /></Field><Field label="Category"><Sel options={['Any','General','OBC','SC','ST','Differently Abled']} /></Field><Field label="Min Match Score"><Sel options={['Any','60%+','70%+','80%+','90%+']} /></Field></Grid>
        <div style={{ textAlign:'right' }}><Btn>🔍 Search Candidates</Btn></div>
      </Card>
      {CandCard({ initials:'AK', name:'Aisha Khan', meta:'Hyderabad · Graduate · 1 yr exp · Data Analyst', skills:['Excel','SQL','Power BI','Communication'], matchPct:'92%', matchColor:'green' })}
      {CandCard({ initials:'RV', name:'Rahul Verma', meta:'Bengaluru · Graduate · 2 yrs exp · Frontend Developer', skills:['HTML','CSS','JavaScript','React'], matchPct:'87%', matchColor:'blue' })}
      {CandCard({ initials:'SI', name:'Sneha Iyer', meta:'Pune · Graduate · 3 yrs exp · QA / Testing', skills:['Selenium','JIRA','Manual Testing','API Testing'], matchPct:'79%', matchColor:'teal' })}
      {CandCard({ initials:'AS', name:'Amit Sharma', meta:'Hyderabad · Diploma · 4 yrs exp · DevOps / Cloud', skills:['AWS','Docker','Kubernetes','CI/CD'], matchPct:'83%', matchColor:'gold' })}
    </>;
  }

  function PanelCandShortlist() {
    return <>
      <Bc parts={['Candidates','Shortlisted']} />
      <SectionHead title="Shortlisted Candidates 📌" />
      <Card>
        <Table head={['Candidate','Job Applied','Shortlisted On','Match','Next Step','Action']} rows={[
          ['Aisha Khan','Data Analyst','Jul 4','92%',<Badge color="blue">Schedule Interview</Badge>,<Btn sm outline>Schedule</Btn>],
          ['Rahul Verma','React Developer','Jul 3','87%',<Badge color="teal">Interview Scheduled</Badge>,<Btn sm outline>View</Btn>],
          ['Amit Sharma','DevOps Eng.','Jul 2','83%',<Badge color="gold">Awaiting Review</Badge>,<Btn sm outline>Review</Btn>],
          ['Deepa Kumar','UI/UX Designer','Jul 1','90%',<Badge color="purple">Offer Pending</Badge>,<Btn sm outline>Send Offer</Btn>],
        ]} />
      </Card>
    </>;
  }

  function PanelCandInterview() {
    return <>
      <Bc parts={['Candidates','Interviews']} />
      <SectionHead title="Interview Management 🗓️" />
      <Card>
        <CardTitle>📅 Schedule New Interview</CardTitle>
        <Grid cols={3}><Field label="Candidate Name"><Inp placeholder="e.g. Rahul Verma" /></Field><Field label="Job Role"><Sel options={['Senior React Developer','Data Analyst','QA Engineer','Product Manager','DevOps Engineer']} /></Field><Field label="Interview Round"><Sel options={['Technical Round 1','Technical Round 2','HR Round','Final Round']} /></Field></Grid>
        <Grid cols={3}><Field label="Date"><Inp type="date" /></Field><Field label="Time"><Inp type="time" /></Field><Field label="Mode"><Sel options={['Video Call','In-Person','Telephonic']} /></Field></Grid>
        <Grid><Field label="Interviewers"><Inp placeholder="e.g. Kavitha Reddy, Arjun Nair" /></Field><Field label="Meeting Link / Venue"><Inp placeholder="e.g. https://meet.google.com/xyz-abc" /></Field></Grid>
        <div style={{ textAlign:'right' }}><Btn green>📅 Schedule Interview</Btn></div>
      </Card>
      <Card>
        <CardTitle>📋 Upcoming Interviews</CardTitle>
        <Table head={['Candidate','Role','Date & Time','Round','Mode','Status']} rows={[
          ['Rahul Verma','React Developer','Jul 5 · 10:00 AM','Technical 1','Video',<Badge color="green">Confirmed</Badge>],
          ['Sneha Iyer','QA Engineer','Jul 5 · 2:00 PM','Technical 2','In-Person',<Badge color="green">Confirmed</Badge>],
          ['Aisha Khan','Data Analyst','Jul 7 · 11:00 AM','HR Round','Telephonic',<Badge color="gold">Pending</Badge>],
          ['Deepa Kumar','UI/UX Designer','Jul 8 · 3:00 PM','Final Round','Video',<Badge color="blue">Scheduled</Badge>],
        ]} />
      </Card>
    </>;
  }

  function PanelCandOffer() {
    return <>
      <Bc parts={['Candidates','Offers & Onboarding']} />
      <SectionHead title="Offers & Onboarding 📨" />
      <Card>
        <CardTitle>📝 Generate Offer Letter</CardTitle>
        <Grid><Field label="Candidate Name"><Inp placeholder="e.g. Priya Verma" /></Field><Field label="Job Role"><Inp placeholder="e.g. Senior React Developer" /></Field></Grid>
        <Grid cols={3}><Field label="CTC (₹/year)"><Inp defaultValue="750000" /></Field><Field label="Joining Date"><Inp type="date" /></Field><Field label="Probation Period"><Sel options={['No Probation','1 Month','3 Months','6 Months']} /></Field></Grid>
        <Field label="Special Terms"><Inp placeholder="e.g. Sign-on bonus of ₹50,000, WFH 2 days/week" /></Field>
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}><Btn teal>Generate Letter</Btn><Btn green>Send via Email</Btn></div>
      </Card>
      <Card>
        <CardTitle>📋 Offer Tracker</CardTitle>
        <Table head={['Candidate','Role','CTC','Offer Sent','Status','Action']} rows={[
          ['Priya Verma','React Developer','₹7.5 LPA','Jul 1, 2026',<Badge color="green">Accepted</Badge>,<Btn sm outline>Onboard</Btn>],
          ['Deepa Kumar','UI/UX Designer','₹8.0 LPA','Jul 3, 2026',<Badge color="gold">Pending</Badge>,<Btn sm outline>Follow Up</Btn>],
          ['Kiran Rao','QA Engineer','₹5.5 LPA','Jun 28, 2026',<Badge color="red">Declined</Badge>,<Btn sm outline>Re-engage</Btn>],
        ]} />
      </Card>
    </>;
  }

  function PanelCandPlaced() {
    return <>
      <Bc parts={['Candidates','Placement Records']} />
      <SectionHead title="Placement Records 🏆" />
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:20 }}>
        <KpiCard val="47"  label="Total Hires" sub="FY 2025-26" color={C.green} />
        <KpiCard val="₹6.8 LPA" label="Avg CTC" sub="Across all hires" color={C.blue} />
        <KpiCard val="87%" label="Offer Acceptance" sub="Industry avg: 74%" color={C.teal} />
        <KpiCard val="92%" label="30-day Retention" sub="Post joining" color={C.purple} />
      </div>
      <Card>
        <Table head={['Name','Role','Joining Date','CTC','Source','Status']} rows={[
          ['Priya Verma','React Developer','Jul 10, 2026','₹7.5 LPA','Skill India Portal',<Badge color="green">Active</Badge>],
          ['Karan Mehta','Data Analyst','Jun 1, 2026','₹5.5 LPA','Campus','Active'],
          ['Neha Singh','DevOps Eng.','May 15, 2026','₹8.0 LPA','Referral',<Badge color="green">Active</Badge>],
          ['Vikas Patel','QA Engineer','Apr 1, 2026','₹4.5 LPA','Skill India Portal',<Badge color="teal">Active</Badge>],
        ]} />
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
      <Alert icon="✅" type="success">TechNova Pvt Ltd is a <strong>PMKVY 4.0 Employer Partner</strong>. You are eligible for placement-linked incentives on certified candidates hired.</Alert>
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
        <Table head={['Metric','TechNova','Sector Avg','Rank']} rows={[
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
        <Table head={['Timestamp','User','Action','Details','IP']} rows={[
          ['Jul 4 · 11:02','Kavitha Reddy','Job Posted','Senior React Developer — 3 openings','122.xx.xx.12'],
          ['Jul 4 · 10:45','Kavitha Reddy','Offer Sent','Priya Verma — ₹7.5 LPA offer letter','122.xx.xx.12'],
          ['Jul 3 · 4:30 PM','Arjun Nair','Candidate Shortlisted','Aisha Khan — Data Analyst','122.xx.xx.14'],
          ['Jul 2 · 3:15 PM','Kavitha Reddy','Interview Scheduled','Rahul Verma · Jul 5, 10:00 AM','122.xx.xx.12'],
          ['Jul 1 · 9:00 AM','System','Auto Report','Weekly Hiring Summary generated','—'],
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
    return <>
      <Bc parts={['Account','Account Preferences']} />
      <SectionHead title="Account Preferences ⚙️" />
      <Card>
        <CardTitle>👤 Account Information</CardTitle>
        <Grid><Field label="Company Name"><Inp defaultValue={user?.org_name || 'TechNova Pvt Ltd'} /></Field><Field label="Login Email"><ValidInp defaultValue={user?.email || 'hr@technova.com'} validate="email" /></Field></Grid>
        <Grid><Field label="HR Helpline"><ValidInp defaultValue="080-4567-8900" validate="phone" /></Field><Field label="State"><Sel options={['Karnataka','Maharashtra','Delhi','Tamil Nadu']} defaultValue="Karnataka" /></Field></Grid>
        <div style={{ textAlign:'right' }}><Btn>💾 Save Changes</Btn></div>
      </Card>
      <Card>
        <CardTitle>🔒 Change Password</CardTitle>
        <Grid><Field label="Current Password"><Inp type="password" placeholder="Current password" /></Field><Field label="New Password"><Inp type="password" placeholder="New password" /></Field></Grid>
        <Field label="Confirm New Password"><Inp type="password" placeholder="Confirm new password" /></Field>
        <div style={{ textAlign:'right' }}><Btn>🔐 Update Password</Btn></div>
      </Card>
      <Card>
        <CardTitle>🔔 Notification Preferences</CardTitle>
        <Toggle label="New applications received" sub="Alert when candidates apply to your jobs" defaultChecked={true} />
        <Toggle label="Shortlist & interview reminders" sub="Remind about scheduled interviews" defaultChecked={true} />
        <Toggle label="Offer status updates" sub="Notify when candidate accepts or declines" defaultChecked={true} />
        <Toggle label="Scheme & incentive alerts" sub="Updates on PMKVY, NAPS incentive credits" defaultChecked={true} />
        <Toggle label="Compliance reminders" sub="PF/ESI filing deadlines and renewal alerts" defaultChecked={true} />
        <Toggle label="Weekly hiring digest" sub="Summary report every Monday morning" defaultChecked={false} />
      </Card>
      <Card>
        <CardTitle>⚠️ Account Actions</CardTitle>
        <div style={{ display:'flex', gap:12 }}>
          <Btn danger>🗑️ Delete Account</Btn>
          <Btn outline onClick={handleLogout}>🚪 Sign Out</Btn>
        </div>
      </Card>
    </>;
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
