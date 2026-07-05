import { validate as fieldValidate, UPPERCASE_FIELDS as UPPERCASE_TYPES } from '../utils/validators.js';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

const SW = 240, TH = 58;
const C = {
  navy:'#0D2137', sidebar:'#1A56C4', blue:'#1E5FBF', teal:'#0B7B8C', green:'#1A7C3E',
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
function Btn({ children, onClick, style, outline, danger, sm }) {
  return <button onClick={onClick} style={{
    padding: sm ? '5px 12px' : '8px 18px',
    borderRadius:8, border: outline ? `1.5px solid ${C.blue}` : 'none',
    background: danger ? C.red : outline ? '#fff' : C.blue,
    color: outline ? C.blue : '#fff',
    fontSize: sm ? 12 : 13, fontWeight:600, cursor:'pointer', ...style,
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
  const [searchQ, setSearchQ] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef(null);

  function toggleMenu(id) {
    setOpenMenus(m => ({ ...m, [id]: !m[id] }));
  }
  function go(key) { setPanel(key); }

  function handleLogout() { logout(); navigate('/login'); }

  const searchResults = searchQ.trim()
    ? SEARCH_INDEX.filter(n => n.label.toLowerCase().includes(searchQ.toLowerCase()) || n.section.toLowerCase().includes(searchQ.toLowerCase())).slice(0, 8)
    : [];

  // ── SIDEBAR ────────────────────────────────────────────────────────────────
  function Sidebar() {
    function NavItem({ icon, label, id, badge, onClick, active }) {
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
      <div style={{ position:'fixed', top:0, left:0, width:SW, height:'100vh', background:C.sidebar, overflowY:'auto', zIndex:200, display:'flex', flexDirection:'column' }}>
        <div style={{ padding:'0 18px', height:TH, display:'flex', alignItems:'center', gap:10, borderBottom:'1px solid rgba(255,255,255,.1)', flexShrink:0 }}>
          <div style={{ width:32, height:32, background:C.blue, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:17 }}>🏢</div>
          <div>
            <div style={{ color:'#fff', fontWeight:800, fontSize:14.5, lineHeight:1.2 }}>SkillsNJobs</div>
            <div style={{ color:'rgba(255,255,255,.5)', fontSize:10 }}>PLACEMENT PARTNER</div>
          </div>
        </div>

        {label('Main')}
        <NavItem icon="🏠" label="Dashboard" active={panel==='dashboard'} onClick={()=>go('dashboard')} />
        <NavItem icon="🔔" label="Notifications" badge="7" active={panel==='notifications'} onClick={()=>go('notifications')} />

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
        <NavItem icon="🎧" label="Helpdesk" active={panel==='helpdesk'} onClick={()=>go('helpdesk')} />
        <NavItem icon="📣" label="Grievance" active={panel==='grievance'} onClick={()=>go('grievance')} />
        <NavItem icon="❓" label="FAQ" active={panel==='faq'} onClick={()=>go('faq')} />

        {label('Account')}
        <NavItem icon="⚙️" label="Account Preferences" active={panel==='settings'} onClick={()=>go('settings')} />
      </div>
    );
  }

  // ── TOPBAR ─────────────────────────────────────────────────────────────────
  function Topbar() {
    return (
      <div style={{ position:'fixed', top:0, left:SW, right:0, height:TH, background:'#fff', borderBottom:'1px solid #e4e8ef', display:'flex', alignItems:'center', padding:'0 20px', gap:12, zIndex:100, boxShadow:'0 1px 4px rgba(0,0,0,.06)' }}>
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
          {searchOpen && searchResults.length > 0 && (
            <div style={{ position:'absolute', top:'calc(100% + 4px)', left:0, right:0, background:'#fff', border:'1.5px solid #dde2eb', borderRadius:8, boxShadow:'0 8px 24px rgba(0,0,0,.12)', zIndex:500, maxHeight:260, overflowY:'auto' }}>
              {searchResults.map(r => (
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
            🔔<span style={{ position:'absolute', top:2, right:2, width:17, height:17, borderRadius:'50%', background:C.red, color:'#fff', fontSize:10, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center' }}>7</span>
          </div>
          <div style={{ width:38, height:38, borderRadius:'50%', background:C.blue, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:15 }}>PP</div>
          <div style={{ lineHeight:1.25 }}>
            <div style={{ fontWeight:700, fontSize:13.5 }}>{user?.org_name || 'Pioneer Placements'}</div>
            <div style={{ fontSize:11.5, color:'#64748b' }}>ID: PP-000012</div>
          </div>
          <button onClick={handleLogout} style={{ background:C.blue, color:'#fff', border:'none', padding:'7px 16px', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer' }}>⏻ Sign Out</button>
        </div>
      </div>
    );
  }

  // ── PANELS ─────────────────────────────────────────────────────────────────
  function PanelDashboard() {
    return <>
      <Alert icon="⚡" type="warn">Action needed: 3 employer demand requests awaiting response. <strong>View Now →</strong></Alert>
      <SectionHead title="Welcome back, Pioneer Placements! 🎯" />
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:14, marginBottom:20 }}>
        <KpiCard val="142" label="Total Placements" sub="This year" />
        <KpiCard val="38" label="Active Jobs" sub="Currently open" color={C.blue} />
        <KpiCard val="214" label="Candidates Pipeline" sub="Across all jobs" color={C.teal} />
        <KpiCard val="26" label="Employers" sub="Registered partners" color={C.green} />
        <KpiCard val="₹4.2L" label="Incentives Earned" sub="PMKVY + PLI" color={C.gold} />
        <KpiCard val="89%" label="Placement Rate" sub="Last 90 days" color={C.purple} />
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
          <Table head={['Job Title','Employer','Applied','Status']} rows={[
            ['Data Entry Operator','TechNova Ltd','22',<Badge color="green">Active</Badge>],
            ['Sales Executive','RetailMart','18',<Badge color="green">Active</Badge>],
            ['Housekeeping Staff','GreenHotel','11',<Badge color="green">Active</Badge>],
            ['Forklift Operator','LogiCo','7',<Badge color="gold">Draft</Badge>],
            ['BPO Associate','CallFirst','31',<Badge color="red">Closed</Badge>],
          ]} />
        </Card>
        <Card>
          <CardTitle>📈 Placement Funnel (This Month)</CardTitle>
          {[['214','Applications Received',100,C.blue],['148','Shortlisted',69,C.teal],['87','Interviewed',41,C.purple],['54','Offers Extended',25,C.gold],['42','Joined / Placed',20,C.green]].map(([n,l,p,c])=>(
            <div key={l} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom:'1px solid #f0f2f5' }}>
              <div style={{ fontSize:22, fontWeight:800, color:C.navy, minWidth:52 }}>{n}</div>
              <div style={{ fontSize:13, color:'#374151', flex:1 }}>{l}</div>
              <div style={{ width:160 }}><ProgBar pct={p} color={c} /></div>
            </div>
          ))}
        </Card>
      </Grid>
      <Grid cols={2}>
        <Card>
          <CardTitle>🔔 Recent Activity</CardTitle>
          <TlItem dot={C.green} title="Riya Sharma joined TechNova as Data Entry Operator" meta="Today · 10:30 AM" />
          <TlItem dot={C.blue} title="3 new applications on Sales Executive role" meta="Today · 9:15 AM" />
          <TlItem dot={C.gold} title="Interview scheduled: Amit Kumar @ RetailMart — Jul 6" meta="Yesterday · 5:20 PM" />
          <TlItem dot={C.purple} title="Incentive claim ₹12,000 submitted under PMKVY" meta="Jul 3, 2026" />
          <TlItem dot={C.teal} title="GreenHotel signed new MoU for 20 positions" meta="Jul 2, 2026" />
        </Card>
        <Card>
          <CardTitle>🏆 Top Employers by Placements</CardTitle>
          <Table head={['Employer','Sector','Placed','Active Jobs']} rows={[
            ['TechNova Ltd','IT-ITES','28',<Badge color="blue">5 Jobs</Badge>],
            ['RetailMart','Retail','22',<Badge color="blue">4 Jobs</Badge>],
            ['GreenHotel','Hospitality','18',<Badge color="green">3 Jobs</Badge>],
            ['LogiCo','Logistics','14',<Badge color="gold">2 Jobs</Badge>],
            ['CallFirst','BPO','12',<Badge color="teal">1 Job</Badge>],
          ]} />
        </Card>
      </Grid>
    </>;
  }

  function PanelNotifications() {
    return <>
      <Bc parts={['Notifications']} />
      <SectionHead title="Notifications 🔔" />
      <Card>
        <TlItem dot={C.red} title="⚠️ Incentive claim IC-2024-089 requires additional documents" meta="Today · 11:00 AM · Schemes" />
        <TlItem dot={C.green} title="✅ Riya Sharma placement confirmed by TechNova" meta="Today · 10:30 AM · Placements" />
        <TlItem dot={C.blue} title="📋 3 new candidate applications on Sales Executive role" meta="Today · 9:15 AM · Jobs" />
        <TlItem dot={C.gold} title="📅 Interview reminder: Amit Kumar @ RetailMart tomorrow 10 AM" meta="Yesterday · 6:00 PM · Interviews" />
        <TlItem dot={C.purple} title="🏛️ New demand from LogiCo — 10 forklift operators needed" meta="Jul 3, 2026 · Employers" />
        <TlItem dot={C.teal} title="📊 Monthly placement report for June 2026 ready" meta="Jul 1, 2026 · Reports" />
        <TlItem dot={C.green} title="✅ MoU with GreenHotel approved and activated" meta="Jun 30, 2026 · Employers" />
      </Card>
    </>;
  }

  function PanelProfileInfo() {
    return <>
      <Bc parts={['Agency Profile','Agency Information']} />
      <SectionHead title="Agency Information 🏢" />
      <Card>
        <Grid><Field label="Agency Name"><Inp defaultValue="Pioneer Placements Pvt. Ltd." /></Field><Field label="Registration Number"><Inp defaultValue="PP-2021-MH-00012" /></Field></Grid>
        <Grid><Field label="Year of Establishment"><Inp defaultValue="2021" /></Field><Field label="Type of Agency"><Sel options={['Private Placement Agency','Government Empanelled','Both']} /></Field></Grid>
        <Field label="About / Mission"><textarea defaultValue="Pioneer Placements bridges skilled youth with leading employers across IT, Retail, Hospitality and Logistics sectors." rows={3} style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #dde2eb', borderRadius:8, fontFamily:'inherit', fontSize:13.5 }} /></Field>
        <Grid><Field label="Total Placements (Lifetime)"><Inp defaultValue="1,240" /></Field><Field label="Active Employer Partners"><Inp defaultValue="26" /></Field></Grid>
        <div style={{ textAlign:'right' }}><Btn style={{ background:C.blue }}>💾 Save Changes</Btn></div>
      </Card>
    </>;
  }

  function PanelProfileContact() {
    return <>
      <Bc parts={['Agency Profile','Contact & Address']} />
      <SectionHead title="Contact & Address 📍" />
      <Card>
        <CardTitle>Primary Contact</CardTitle>
        <Grid><Field label="Contact Person"><Inp defaultValue="Suresh Patil" /></Field><Field label="Designation"><Inp defaultValue="Director" /></Field></Grid>
        <Grid><Field label="Mobile"><ValidInp defaultValue="9876543210" validate="mobile" /></Field><Field label="Email"><ValidInp defaultValue="suresh@pioneerplacements.in" validate="email" /></Field></Grid>
      </Card>
      <Card>
        <CardTitle>Office Address</CardTitle>
        <Field label="Address Line 1"><Inp defaultValue="Shop 12, Millennium Business Park" /></Field>
        <Field label="Address Line 2"><Inp defaultValue="Mahape, Navi Mumbai" /></Field>
        <Grid><Field label="City"><Inp defaultValue="Navi Mumbai" /></Field><Field label="State"><Sel options={['Maharashtra','Karnataka','Tamil Nadu','Telangana','Delhi','Gujarat']} /></Field></Grid>
        <Grid><Field label="PIN Code"><ValidInp defaultValue="400710" validate="pincode" /></Field><Field label="District"><Inp defaultValue="Thane" /></Field></Grid>
        <div style={{ textAlign:'right' }}><Btn style={{ background:C.blue }}>💾 Save Changes</Btn></div>
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
    return <>
      <Bc parts={['Agency Profile','Bank Details']} />
      <SectionHead title="Bank Details 🏦" />
      <Alert icon="🔒" type="info">Bank details are used for incentive disbursals. Keep them accurate and up to date.</Alert>
      <Card>
        <Grid><Field label="Account Holder Name"><Inp defaultValue="Pioneer Placements Pvt. Ltd." /></Field><Field label="Bank Name"><Inp defaultValue="State Bank of India" /></Field></Grid>
        <Grid><Field label="Account Number"><Inp defaultValue="XXXXXXXX4521" /></Field><Field label="IFSC Code"><ValidInp defaultValue="SBIN0005678" validate="ifsc" /></Field></Grid>
        <Grid><Field label="Account Type"><Sel options={['Current Account','Savings Account']} /></Field><Field label="Branch"><Inp defaultValue="Mahape, Navi Mumbai" /></Field></Grid>
        <Field label="Cancelled Cheque / Passbook"><input type="file" style={{ padding:6 }} /></Field>
        <div style={{ textAlign:'right' }}><Btn style={{ background:C.blue }}>💾 Save Bank Details</Btn></div>
      </Card>
    </>;
  }

  function PanelJobPost() {
    return <>
      <Bc parts={['Job Postings','Post a Job']} />
      <SectionHead title="Post a Job 📋" />
      <Card>
        <Field label="Job Title"><Inp placeholder="e.g., Data Entry Operator" /></Field>
        <Grid><Field label="Employer / Company"><Sel options={['TechNova Ltd','RetailMart','GreenHotel','LogiCo','CallFirst','+ Add New']} /></Field><Field label="Job Location"><Inp placeholder="City" /></Field></Grid>
        <Grid><Field label="Job Sector"><Sel options={['IT-ITES','Retail','Hospitality','Logistics','BPO','Healthcare','Construction']} /></Field><Field label="NSQF Level"><Sel options={['NSQF Level 2','NSQF Level 3','NSQF Level 4','NSQF Level 5']} /></Field></Grid>
        <Grid><Field label="Number of Vacancies"><Inp defaultValue="10" /></Field><Field label="Salary Range (₹/month)"><Inp placeholder="e.g., 12000 – 18000" /></Field></Grid>
        <Grid><Field label="Min. Qualification"><Sel options={['10th Pass','12th Pass','Diploma','Graduate','Any']} /></Field><Field label="Experience"><Sel options={['Fresher','0–1 year','1–3 years','3+ years']} /></Field></Grid>
        <Grid><Field label="Application Deadline"><input type="date" defaultValue="2026-07-31" style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #dde2eb', borderRadius:8, fontSize:13.5 }} /></Field><Field label="Job Type"><Sel options={['Full-time','Part-time','Contract','Apprenticeship']} /></Field></Grid>
        <Field label="Job Description"><textarea rows={4} placeholder="Describe roles, responsibilities, requirements…" style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #dde2eb', borderRadius:8, fontFamily:'inherit', fontSize:13.5 }} /></Field>
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}><Btn outline>Save as Draft</Btn> <Btn style={{ background:C.blue }}>🚀 Post Job</Btn></div>
      </Card>
    </>;
  }

  function PanelJobsActive() {
    return <>
      <Bc parts={['Job Postings','Active Jobs']} />
      <SectionHead title="Active Jobs 📋" />
      <div style={{ display:'flex', gap:10, marginBottom:14 }}><input style={{ flex:1, padding:'8px 12px', border:'1.5px solid #dde2eb', borderRadius:8, fontSize:13 }} placeholder="Search jobs…" /><Btn style={{ background:C.blue }}>+ Post New Job</Btn></div>
      <Card>
        <Table head={['Job Title','Employer','Location','Vacancies','Applied','Deadline','Action']} rows={[
          ['Data Entry Operator','TechNova Ltd','Pune','10','22',<Badge color="green">Jul 31</Badge>,<Btn sm outline>View</Btn>],
          ['Sales Executive','RetailMart','Mumbai','15','18',<Badge color="gold">Jul 25</Badge>,<Btn sm outline>View</Btn>],
          ['Housekeeping Staff','GreenHotel','Goa','8','11',<Badge color="green">Aug 5</Badge>,<Btn sm outline>View</Btn>],
          ['Healthcare Worker','MediCare','Nagpur','5','6',<Badge color="gold">Jul 20</Badge>,<Btn sm outline>View</Btn>],
          ['BPO Associate','CallFirst','Hyderabad','20','31',<Badge color="green">Aug 10</Badge>,<Btn sm outline>View</Btn>],
        ]} />
      </Card>
    </>;
  }

  function PanelJobsDraft() {
    return <>
      <Bc parts={['Job Postings','Drafts']} />
      <SectionHead title="Draft Jobs" />
      <Card>
        <Table head={['Job Title','Employer','Last Edited','Action']} rows={[
          ['Forklift Operator','LogiCo','Jul 3, 2026',<><Btn sm outline>Edit</Btn> <Btn sm style={{ background:C.blue }}>Publish</Btn></>],
          ['Lab Technician','PharmaCo','Jun 28, 2026',<><Btn sm outline>Edit</Btn> <Btn sm style={{ background:C.blue }}>Publish</Btn></>],
        ]} />
      </Card>
    </>;
  }

  function PanelJobsClosed() {
    return <>
      <Bc parts={['Job Postings','Closed Jobs']} />
      <SectionHead title="Closed Jobs" />
      <Card>
        <Table head={['Job Title','Employer','Closed On','Placed','Action']} rows={[
          ['BPO Voice Process','CallFirst','Jun 30, 2026','12',<Btn sm outline>Repost</Btn>],
          ['Floor Manager','RetailMart','Jun 15, 2026','8',<Btn sm outline>Repost</Btn>],
          ['Data Analyst','InfoSys','May 31, 2026','3',<Btn sm outline>Repost</Btn>],
        ]} />
      </Card>
    </>;
  }

  function PanelCandSearch() {
    return <>
      <Bc parts={['Candidates','Search Candidates']} />
      <SectionHead title="Search Candidates 🔍" />
      <Card>
        <CardTitle>Filters</CardTitle>
        <Grid><Field label="Sector / Trade"><Sel options={['All','IT-ITES','Retail','Hospitality','Healthcare','Logistics','BPO']} /></Field><Field label="NSQF Level"><Sel options={['All','Level 2','Level 3','Level 4','Level 5']} /></Field></Grid>
        <Grid><Field label="Location"><Inp placeholder="City or State" /></Field><Field label="Qualification"><Sel options={['Any','10th Pass','12th Pass','Diploma','Graduate']} /></Field></Grid>
        <div style={{ textAlign:'right' }}><Btn style={{ background:C.blue }}>🔍 Search</Btn></div>
      </Card>
      <Card>
        <CardTitle>Search Results (147 candidates)</CardTitle>
        <Table head={['Name','Sector','NSQF Level','Location','Training Status','Action']} rows={[
          ['Priya Mehta','IT-ITES','Level 4','Pune',<Badge color="green">Certified</Badge>,<Btn sm style={{ background:C.blue }}>Shortlist</Btn>],
          ['Raju Yadav','Retail','Level 3','Mumbai',<Badge color="green">Certified</Badge>,<Btn sm style={{ background:C.blue }}>Shortlist</Btn>],
          ['Anita Desai','Hospitality','Level 3','Goa',<Badge color="blue">In Training</Badge>,<Btn sm style={{ background:C.blue }}>Shortlist</Btn>],
          ['Suresh Kumar','Logistics','Level 2','Nagpur',<Badge color="green">Certified</Badge>,<Btn sm style={{ background:C.blue }}>Shortlist</Btn>],
          ['Deepa Nair','BPO','Level 4','Chennai',<Badge color="green">Certified</Badge>,<Btn sm style={{ background:C.blue }}>Shortlist</Btn>],
        ]} />
      </Card>
    </>;
  }

  function PanelCandShortlisted() {
    return <>
      <Bc parts={['Candidates','Shortlisted']} />
      <SectionHead title="Shortlisted Candidates" />
      <Card>
        <Table head={['Name','Job Role','Employer','Shortlisted On','Status','Action']} rows={[
          ['Priya Mehta','Data Entry Operator','TechNova','Jul 1, 2026',<Badge color="gold">Awaiting Interview</Badge>,<Btn sm style={{ background:C.blue }}>Schedule</Btn>],
          ['Raju Yadav','Sales Executive','RetailMart','Jul 2, 2026',<Badge color="blue">Interview Scheduled</Badge>,<Btn sm outline>View</Btn>],
          ['Suresh Kumar','Forklift Operator','LogiCo','Jul 3, 2026',<Badge color="gold">Awaiting Interview</Badge>,<Btn sm style={{ background:C.blue }}>Schedule</Btn>],
          ['Deepa Nair','BPO Associate','CallFirst','Jul 3, 2026',<Badge color="teal">Interview Done</Badge>,<Btn sm outline>Update</Btn>],
        ]} />
      </Card>
    </>;
  }

  function PanelCandApplications() {
    return <>
      <Bc parts={['Candidates','Applications Received']} />
      <SectionHead title="Applications Received 📥" />
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:14, marginBottom:20 }}>
        <KpiCard val="214" label="Total Applications" sub="This month" />
        <KpiCard val="148" label="Reviewed" sub="Screened" color={C.blue} />
        <KpiCard val="87" label="Shortlisted" sub="Moved to interview" color={C.green} />
        <KpiCard val="66" label="Pending Review" sub="Action needed" color={C.red} />
      </div>
      <Card>
        <Table head={['Candidate','Job Applied','Applied On','Experience','Status','Action']} rows={[
          ['Amit Sharma','Data Entry Operator','Jul 4, 2026','Fresher',<Badge color="blue">New</Badge>,<Btn sm style={{ background:C.blue }}>Review</Btn>],
          ['Kavita Joshi','Sales Executive','Jul 4, 2026','1 yr',<Badge color="blue">New</Badge>,<Btn sm style={{ background:C.blue }}>Review</Btn>],
          ['Mohan Das','BPO Associate','Jul 3, 2026','Fresher',<Badge color="gold">Reviewed</Badge>,<Btn sm outline>Shortlist</Btn>],
          ['Lata Rao','Housekeeping','Jul 3, 2026','2 yrs',<Badge color="green">Shortlisted</Badge>,<Btn sm outline>View</Btn>],
        ]} />
      </Card>
    </>;
  }

  function PanelCandInterview() {
    return <>
      <Bc parts={['Candidates','Interview Pipeline']} />
      <SectionHead title="Interview Pipeline 🗓️" />
      <Card>
        <CardTitle>Scheduled Interviews</CardTitle>
        <Table head={['Candidate','Job Role','Employer','Date & Time','Mode','Status','Action']} rows={[
          ['Raju Yadav','Sales Executive','RetailMart','Jul 5, 2026 10:00 AM','In-person',<Badge color="blue">Upcoming</Badge>,<Btn sm style={{ background:C.blue }}>Confirm</Btn>],
          ['Deepa Nair','BPO Associate','CallFirst','Jul 5, 2026 2:00 PM','Video Call',<Badge color="blue">Upcoming</Badge>,<Btn sm style={{ background:C.blue }}>Confirm</Btn>],
          ['Priya Mehta','Data Entry','TechNova','Jul 6, 2026 11:00 AM','In-person',<Badge color="gold">Upcoming</Badge>,<Btn sm outline>Reschedule</Btn>],
        ]} />
      </Card>
      <Card>
        <CardTitle>Schedule New Interview</CardTitle>
        <Grid><Field label="Candidate"><Sel options={['Select candidate','Amit Sharma','Kavita Joshi','Mohan Das']} /></Field><Field label="Job Role"><Sel options={['Select job','Data Entry Operator','Sales Executive','BPO Associate']} /></Field></Grid>
        <Grid><Field label="Interview Date"><input type="date" style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #dde2eb', borderRadius:8, fontSize:13.5 }} /></Field><Field label="Interview Time"><input type="time" style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #dde2eb', borderRadius:8, fontSize:13.5 }} /></Field></Grid>
        <Grid><Field label="Mode"><Sel options={['In-person','Video Call','Phone Call']} /></Field><Field label="Interviewer Name"><Inp placeholder="" /></Field></Grid>
        <div style={{ textAlign:'right' }}><Btn style={{ background:C.blue }}>📅 Schedule Interview</Btn></div>
      </Card>
    </>;
  }

  function PanelCandOffer() {
    return <>
      <Bc parts={['Candidates','Offer Letters']} />
      <SectionHead title="Offer Letters 📩" />
      <Card>
        <Table head={['Candidate','Job Role','Employer','Offer Date','Salary','Status','Action']} rows={[
          ['Riya Sharma','Data Entry Operator','TechNova Ltd','Jun 28, 2026','₹14,000/mo',<Badge color="green">Accepted</Badge>,<Btn sm outline>View</Btn>],
          ['Mohan Das','BPO Associate','CallFirst','Jun 30, 2026','₹16,000/mo',<Badge color="gold">Pending</Badge>,<Btn sm style={{ background:C.blue }}>Follow up</Btn>],
          ['Lata Rao','Housekeeping','GreenHotel','Jul 1, 2026','₹11,000/mo',<Badge color="green">Accepted</Badge>,<Btn sm outline>View</Btn>],
          ['Suresh V','Forklift Operator','LogiCo','Jul 2, 2026','₹18,000/mo',<Badge color="red">Rejected</Badge>,<Btn sm outline>Reassign</Btn>],
        ]} />
      </Card>
      <Card>
        <CardTitle>Generate Offer Letter</CardTitle>
        <Grid><Field label="Candidate"><Sel options={['Select','Amit Sharma','Kavita Joshi']} /></Field><Field label="Job Role"><Sel options={['Select','Data Entry Operator','Sales Executive']} /></Field></Grid>
        <Grid><Field label="Joining Date"><input type="date" style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #dde2eb', borderRadius:8, fontSize:13.5 }} /></Field><Field label="Offered CTC (₹/month)"><Inp placeholder="e.g., 15000" /></Field></Grid>
        <div style={{ textAlign:'right' }}><Btn style={{ background:C.blue }}>📄 Generate & Send</Btn></div>
      </Card>
    </>;
  }

  function PanelPlActive() {
    return <>
      <Bc parts={['Placement Tracker','Active Placements']} />
      <SectionHead title="Active Placements 🎯" />
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:14, marginBottom:20 }}>
        <KpiCard val="58" label="Currently Placed" sub="In employment" />
        <KpiCard val="42" label="< 30 Days" sub="Recent joins" color={C.green} />
        <KpiCard val="11" label="30–90 Days" sub="Stable" color={C.blue} />
        <KpiCard val="5" label="> 90 Days" sub="Long-term" color={C.purple} />
      </div>
      <Card>
        <Table head={['Candidate','Employer','Role','Joined On','Days','Status','Action']} rows={[
          ['Riya Sharma','TechNova Ltd','Data Entry Operator','Jul 1, 2026','3',<Badge color="green">Active</Badge>,<Btn sm outline>View</Btn>],
          ['Lata Rao','GreenHotel','Housekeeping','Jun 20, 2026','14',<Badge color="green">Active</Badge>,<Btn sm outline>View</Btn>],
          ['Mohan Das','CallFirst','BPO Associate','Jun 10, 2026','24',<Badge color="green">Active</Badge>,<Btn sm outline>View</Btn>],
          ['Anita Desai','RetailMart','Sales Executive','May 5, 2026','60',<Badge color="blue">Stable</Badge>,<Btn sm outline>View</Btn>],
          ['Raju Yadav','LogiCo','Forklift Operator','Apr 1, 2026','94',<Badge color="purple">Long-term</Badge>,<Btn sm outline>View</Btn>],
        ]} />
      </Card>
    </>;
  }

  function PanelPlCompleted() {
    return <>
      <Bc parts={['Placement Tracker','Completed Placements']} />
      <SectionHead title="Completed Placements ✅" />
      <Card>
        <CardTitle>This Year: 142 Placements</CardTitle>
        <Table head={['Candidate','Employer','Role','Start Date','End Date','Duration','Incentive']} rows={[
          ['Kavita Nair','InfoSys','Data Analyst','Jan 10, 2026','Jun 30, 2026','6 months',<Badge color="green">₹6,000 Claimed</Badge>],
          ['Vijay Kumar','RetailMart','Store Manager','Feb 1, 2026','May 31, 2026','4 months',<Badge color="green">₹4,000 Claimed</Badge>],
          ['Smita Joshi','PharmaCo','Lab Technician','Mar 15, 2026','Jun 15, 2026','3 months',<Badge color="gold">Pending</Badge>],
        ]} />
      </Card>
    </>;
  }

  function PanelPlDropout() {
    return <>
      <Bc parts={['Placement Tracker','Dropout / Withdrawn']} />
      <SectionHead title="Dropout / Withdrawn ⚠️" />
      <Alert icon="ℹ️" type="info">Documenting dropout reasons helps improve future matching and scheme compliance.</Alert>
      <Card>
        <Table head={['Candidate','Employer','Role','Joined','Left On','Reason','Action']} rows={[
          ['Suresh V','LogiCo','Forklift Operator','Jun 1, 2026','Jun 15, 2026',<Badge color="gold">Personal Reason</Badge>,<Btn sm outline>Update</Btn>],
          ['Deepa Nair','CallFirst','BPO Associate','May 10, 2026','May 25, 2026',<Badge color="red">Health Issue</Badge>,<Btn sm outline>Update</Btn>],
          ['Rahul Das','GreenHotel','Housekeeping','Apr 1, 2026','Apr 20, 2026',<Badge color="teal">Relocation</Badge>,<Btn sm outline>Update</Btn>],
        ]} />
      </Card>
    </>;
  }

  function PanelPlIncentive() {
    return <>
      <Bc parts={['Placement Tracker','Incentive Claims']} />
      <SectionHead title="Incentive Claims 💰" />
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:14, marginBottom:20 }}>
        <KpiCard val="₹4.2L" label="Total Earned" sub="This year" color={C.green} />
        <KpiCard val="₹1.1L" label="Pending Disbursal" sub="Under review" color={C.gold} />
        <KpiCard val="₹3.1L" label="Disbursed" sub="Received" color={C.blue} />
        <KpiCard val="22" label="Claims Filed" sub="This year" />
      </div>
      <Card>
        <CardTitle>Claims History</CardTitle>
        <Table head={['Claim ID','Scheme','Candidate','Amount','Filed On','Status']} rows={[
          ['IC-2026-022','PMKVY PLI','Riya Sharma','₹12,000','Jul 2, 2026',<Badge color="gold">Under Review</Badge>],
          ['IC-2026-021','PMKVY PLI','Lata Rao','₹12,000','Jun 28, 2026',<Badge color="green">Approved</Badge>],
          ['IC-2026-019','DDU-GKY','Raju Yadav','₹15,000','Jun 20, 2026',<Badge color="teal">Disbursed</Badge>],
          ['IC-2026-015','NAPS','Mohan Das','₹8,000','Jun 10, 2026',<Badge color="teal">Disbursed</Badge>],
          ['IC-2026-010','PMKVY PLI','Anita Desai','₹12,000','May 15, 2026',<Badge color="red">Rejected</Badge>],
        ]} />
      </Card>
      <Card>
        <CardTitle>File New Claim</CardTitle>
        <Grid><Field label="Scheme"><Sel options={['PMKVY Placement Linked Incentive','DDU-GKY','NAPS','PLI']} /></Field><Field label="Candidate"><Sel options={['Select Candidate','Riya Sharma','Lata Rao','Suresh Kumar']} /></Field></Grid>
        <Grid><Field label="Employer"><Sel options={['Select Employer','TechNova Ltd','RetailMart','GreenHotel']} /></Field><Field label="Joining Date"><input type="date" style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #dde2eb', borderRadius:8, fontSize:13.5 }} /></Field></Grid>
        <Field label="Upload Joining Letter / Appointment Letter"><input type="file" style={{ padding:6 }} /></Field>
        <div style={{ textAlign:'right' }}><Btn style={{ background:C.blue }}>📤 Submit Claim</Btn></div>
      </Card>
    </>;
  }

  function PanelEmpList() {
    return <>
      <Bc parts={['Employers','Registered Employers']} />
      <SectionHead title="Registered Employers 🏭" />
      <div style={{ display:'flex', gap:10, marginBottom:14 }}><input style={{ flex:1, padding:'8px 12px', border:'1.5px solid #dde2eb', borderRadius:8, fontSize:13 }} placeholder="Search employers…" /><Btn style={{ background:C.blue }}>+ Add Employer</Btn></div>
      <Card>
        <Table head={['Employer','Sector','City','MoU','Open Jobs','Placements','Status']} rows={[
          ['TechNova Ltd','IT-ITES','Pune',<Badge color="green">Active</Badge>,'5','28',<Badge color="green">Active</Badge>],
          ['RetailMart','Retail','Mumbai',<Badge color="green">Active</Badge>,'4','22',<Badge color="green">Active</Badge>],
          ['GreenHotel','Hospitality','Goa',<Badge color="green">Active</Badge>,'3','18',<Badge color="green">Active</Badge>],
          ['LogiCo','Logistics','Nagpur',<Badge color="green">Active</Badge>,'2','14',<Badge color="green">Active</Badge>],
          ['CallFirst','BPO','Hyderabad',<Badge color="red">Expired</Badge>,'1','12',<Badge color="red">Inactive</Badge>],
          ['PharmaCo','Healthcare','Pune',<Badge color="gold">Pending</Badge>,'0','0',<Badge color="gold">Pending</Badge>],
        ]} />
      </Card>
    </>;
  }

  function PanelEmpAdd() {
    return <>
      <Bc parts={['Employers','Add Employer']} />
      <SectionHead title="Add Employer 🏭" />
      <Card>
        <Grid><Field label="Company Name"><Inp placeholder="" /></Field><Field label="Industry / Sector"><Sel options={['IT-ITES','Retail','Hospitality','Logistics','BPO','Healthcare','Manufacturing']} /></Field></Grid>
        <Grid><Field label="Contact Person"><Inp placeholder="" /></Field><Field label="Designation"><Inp placeholder="" /></Field></Grid>
        <Grid><Field label="Mobile"><ValidInp placeholder="" validate="mobile" /></Field><Field label="Email"><ValidInp placeholder="" validate="email" /></Field></Grid>
        <Grid><Field label="City"><Inp placeholder="" /></Field><Field label="State"><Sel options={['Maharashtra','Karnataka','Tamil Nadu','Telangana','Delhi']} /></Field></Grid>
        <Grid><Field label="Number of Vacancies (Approx.)"><Inp placeholder="" /></Field><Field label="Preferred NSQF Level"><Sel options={['Level 2','Level 3','Level 4','Level 5','Any']} /></Field></Grid>
        <Field label="Notes / Demand Details"><textarea rows={3} style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #dde2eb', borderRadius:8, fontFamily:'inherit', fontSize:13.5 }} /></Field>
        <div style={{ textAlign:'right' }}><Btn style={{ background:C.blue }}>➕ Add Employer</Btn></div>
      </Card>
    </>;
  }

  function PanelEmpMou() {
    return <>
      <Bc parts={['Employers','MoU / Agreements']} />
      <SectionHead title="MoU / Agreements 📑" />
      <Card>
        <CardTitle>Active Agreements</CardTitle>
        <Table head={['Employer','MoU Date','Expiry','Positions','Status','Action']} rows={[
          ['TechNova Ltd','Jan 15, 2026','Jan 14, 2027','50',<Badge color="green">Active</Badge>,<Btn sm outline>View</Btn>],
          ['RetailMart','Mar 1, 2026','Feb 28, 2027','60',<Badge color="green">Active</Badge>,<Btn sm outline>View</Btn>],
          ['GreenHotel','Jun 30, 2026','Jun 29, 2027','20',<Badge color="green">Active</Badge>,<Btn sm outline>View</Btn>],
          ['CallFirst','Dec 1, 2025','Nov 30, 2026','40',<Badge color="gold">Expiring Soon</Badge>,<Btn sm style={{ background:C.blue }}>Renew</Btn>],
        ]} />
      </Card>
      <Card>
        <CardTitle>Upload New MoU</CardTitle>
        <Grid><Field label="Employer"><Sel options={['Select Employer','TechNova Ltd','RetailMart']} /></Field><Field label="MoU Date"><input type="date" style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #dde2eb', borderRadius:8, fontSize:13.5 }} /></Field></Grid>
        <Grid><Field label="Validity (months)"><Inp defaultValue="12" /></Field><Field label="No. of Positions"><Inp placeholder="" /></Field></Grid>
        <Field label="Upload Signed MoU (PDF)"><input type="file" style={{ padding:6 }} /></Field>
        <div style={{ textAlign:'right' }}><Btn style={{ background:C.blue }}>📤 Upload MoU</Btn></div>
      </Card>
    </>;
  }

  function PanelEmpDemand() {
    return <>
      <Bc parts={['Employers','Demand Requests']} />
      <SectionHead title="Demand Requests 📬" />
      <Alert icon="🔔" type="warn">3 new demand requests from employers require your response.</Alert>
      <Card>
        <Table head={['Employer','Role Required','Quantity','Sector','Received','Action']} rows={[
          ['LogiCo','Forklift Operator','10','Logistics','Jul 3, 2026',<Btn sm style={{ background:C.blue }}>Respond</Btn>],
          ['PharmaCo','Lab Technician','5','Healthcare','Jul 2, 2026',<Btn sm style={{ background:C.blue }}>Respond</Btn>],
          ['NewAge BPO','Voice Associate','20','BPO','Jul 1, 2026',<Btn sm style={{ background:C.blue }}>Respond</Btn>],
          ['GreenHotel','Kitchen Staff','8','Hospitality','Jun 30, 2026',<Badge color="teal">Responded</Badge>],
        ]} />
      </Card>
    </>;
  }

  function PanelSchemePmkvy() {
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
            <KpiCard val="38" label="Placed under PMKVY" sub="This year" color={C.blue} />
            <KpiCard val="₹4.56L" label="Incentives Claimed" sub="Total" color={C.green} />
            <KpiCard val="31" label="Claims Approved" sub="Out of 38" />
            <KpiCard val="7" label="Pending Claims" sub="Under review" color={C.gold} />
          </div>
        </Card>
      </Grid>
      <Card>
        <CardTitle>PMKVY Placed Candidates</CardTitle>
        <Table head={['Candidate','Employer','Role','Joined','90-Day Check','Incentive']} rows={[
          ['Riya Sharma','TechNova','Data Entry','Jul 1, 2026','Sep 29, 2026',<Badge color="gold">Pending</Badge>],
          ['Lata Rao','GreenHotel','Housekeeping','Jun 20, 2026','Sep 18, 2026',<Badge color="gold">Pending</Badge>],
          ['Anita Desai','RetailMart','Sales Executive','May 5, 2026','Aug 3, 2026',<Badge color="blue">Filed</Badge>],
          ['Kavita Nair','InfoSys','Data Analyst','Jan 10, 2026','Apr 10, 2026',<Badge color="teal">Disbursed</Badge>],
        ]} />
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
          <div style={{ marginTop:10 }}><Badge color="green">8 apprentices under NAPS</Badge></div>
        </Card>
        <Card>
          <CardTitle>NATS — National Apprenticeship Training Scheme</CardTitle>
          <table style={{ width:'100%' }}><tbody>
            {[['Administered By','Board of Apprenticeship Training'],['Target','Diploma / Degree graduates'],['Duration','1 year'],['Stipend','As per company norms + Govt. top-up']].map(([k,v])=>(
              <tr key={k}><td style={{ color:'#64748b', fontSize:12, padding:'6px 0' }}>{k}</td><td style={{ fontWeight:700 }}>{v}</td></tr>
            ))}
          </tbody></table>
          <div style={{ marginTop:10 }}><Badge color="teal">3 apprentices under NATS</Badge></div>
        </Card>
      </Grid>
    </>;
  }

  function PanelSchemeDdugky() {
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
        <Table head={['Candidate','Employer','Role','Wage','Status','Incentive']} rows={[
          ['Raju Yadav','LogiCo','Forklift Operator','₹18,000/mo',<Badge color="green">3-Month Completed</Badge>,<Badge color="green">₹15,000 Claimed</Badge>],
          ['Suresh Kumar','RetailMart','Floor Staff','₹9,000/mo',<Badge color="blue">Under Tracking</Badge>,<Badge color="gold">Pending</Badge>],
        ]} />
      </Card>
    </>;
  }

  function PanelSchemePli() {
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
        <Table head={['Candidate','Employer','Join Date','90-Day Date','Days Left','Claim Status']} rows={[
          ['Riya Sharma','TechNova','Jul 1, 2026','Sep 29, 2026','87 days',<Badge color="gold">Not Yet Eligible</Badge>],
          ['Lata Rao','GreenHotel','Jun 20, 2026','Sep 18, 2026','76 days',<Badge color="gold">Not Yet Eligible</Badge>],
          ['Anita Desai','RetailMart','May 5, 2026','Aug 3, 2026','30 days',<Badge color="blue">Almost Ready</Badge>],
          ['Kavita Nair','InfoSys','Jan 10, 2026','Apr 10, 2026','0 days',<Badge color="green">Claim Filed</Badge>],
        ]} />
      </Card>
    </>;
  }

  function PanelRepPlacement() {
    return <>
      <Bc parts={['Reports','Placement Reports']} />
      <SectionHead title="Placement Reports 📊" />
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:14, marginBottom:20 }}>
        <KpiCard val="142" label="Total Placements" sub="Jan–Jun 2026" />
        <KpiCard val="89%" label="Placement Rate" sub="Offer accepted" color={C.green} />
        <KpiCard val="78%" label="30-day Retention" sub="Still employed" color={C.blue} />
        <KpiCard val="65%" label="90-day Retention" sub="PLI eligible" color={C.purple} />
      </div>
      <Card>
        <CardTitle>Placements by Sector</CardTitle>
        <Table head={['Sector','Placed','% Share','Avg. Salary']} rows={[
          ['IT-ITES','38','26.8%','₹16,200'],
          ['Retail','32','22.5%','₹11,500'],
          ['Hospitality','28','19.7%','₹10,800'],
          ['Logistics','22','15.5%','₹14,000'],
          ['BPO','22','15.5%','₹15,500'],
        ]} />
      </Card>
      <div style={{ textAlign:'right', marginTop:10 }}><Btn style={{ background:C.blue }}>📥 Download PDF</Btn> <Btn outline>📊 Download Excel</Btn></div>
    </>;
  }

  function PanelRepCandidate() {
    return <>
      <Bc parts={['Reports','Candidate Reports']} />
      <SectionHead title="Candidate Reports 👥" />
      <Card>
        <CardTitle>Candidate Pipeline Summary</CardTitle>
        <Table head={['Stage','Count','% of Total']} rows={[
          ['Applications Received','214','100%'],['Screened','148','69.2%'],['Shortlisted','87','40.7%'],
          ['Interviewed','54','25.2%'],['Offered','42','19.6%'],['Joined','38','17.8%'],
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
    return <>
      <Bc parts={['Reports','Employer Reports']} />
      <SectionHead title="Employer Reports 🏭" />
      <Card>
        <Table head={['Employer','Vacancies','Placed','Fill Rate','Avg. Days to Fill','Retention 90d']} rows={[
          ['TechNova Ltd','50','28','56%','12 days',<Badge color="green">82%</Badge>],
          ['RetailMart','60','22','37%','18 days',<Badge color="gold">68%</Badge>],
          ['GreenHotel','20','18','90%','8 days',<Badge color="green">89%</Badge>],
          ['LogiCo','30','14','47%','21 days',<Badge color="gold">71%</Badge>],
          ['CallFirst','40','12','30%','25 days',<Badge color="red">50%</Badge>],
        ]} />
      </Card>
    </>;
  }

  function PanelRepMonthly() {
    return <>
      <Bc parts={['Reports','Monthly Summary']} />
      <SectionHead title="Monthly Summary 📅" />
      <Card>
        <CardTitle>June 2026 Summary</CardTitle>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:14, marginBottom:16 }}>
          <KpiCard val="42" label="Placements" sub="Jun 2026" color={C.green} />
          <KpiCard val="214" label="New Applications" sub="Jun 2026" />
          <KpiCard val="7" label="New Employers" sub="Added" color={C.blue} />
          <KpiCard val="₹84,000" label="Incentives Filed" sub="PMKVY + PLI" color={C.gold} />
        </div>
        <Table head={['Metric','Jun 2026','May 2026','Change']} rows={[
          ['Placements','42','38',<Badge color="green">+10.5%</Badge>],
          ['Applications','214','188',<Badge color="green">+13.8%</Badge>],
          ['Shortlisting Rate','40.7%','38.2%',<Badge color="green">+2.5pp</Badge>],
          ['Offer Acceptance Rate','90.5%','89.2%',<Badge color="green">+1.3pp</Badge>],
          ['90-day Retention','65%','61%',<Badge color="green">+4pp</Badge>],
        ]} />
      </Card>
    </>;
  }

  function PanelRepIncentive() {
    return <>
      <Bc parts={['Reports','Incentive Reports']} />
      <SectionHead title="Incentive Reports 💰" />
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:14, marginBottom:20 }}>
        <KpiCard val="₹4.2L" label="Total Earned" sub="2026" color={C.green} />
        <KpiCard val="₹3.1L" label="Disbursed" sub="Received" color={C.blue} />
        <KpiCard val="₹1.1L" label="Pending" sub="Under review" color={C.gold} />
        <KpiCard val="₹18K" label="Rejected" sub="Need resubmission" color={C.red} />
      </div>
      <Card>
        <Table head={['Scheme','Claims','Approved','Amount Disbursed','Pending']} rows={[
          ['PMKVY PLI','14','11','₹1,32,000','₹36,000'],
          ['DDU-GKY','5','4','₹60,000','₹15,000'],
          ['NAPS','3','3','₹24,000','₹0'],
          ['PLI (Other)','0','0','₹0','₹0'],
        ]} />
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
        <Table head={['Ticket ID','Subject','Status','Created','Action']} rows={[
          ['TKT-2026-041','Incentive claim IC-2026-010 rejected query',<Badge color="blue">Open</Badge>,'Jul 3, 2026',<Btn sm outline>View</Btn>],
          ['TKT-2026-035','MoU upload not reflecting',<Badge color="green">Resolved</Badge>,'Jun 28, 2026',<Btn sm outline>View</Btn>],
        ]} />
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
        <Table head={['GRV ID','Category','Status','Submitted','Resolution']} rows={[
          ['GRV-2026-012','Incentive Not Disbursed',<Badge color="gold">Under Review</Badge>,'Jun 25, 2026','—'],
          ['GRV-2026-008','Portal Technical Issue',<Badge color="green">Resolved</Badge>,'Jun 10, 2026','Jun 15, 2026'],
        ]} />
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
    return <>
      <Bc parts={['Account','Account Preferences']} />
      <SectionHead title="Account Preferences ⚙️" />
      <Card style={{ marginBottom:18 }}>
        <CardTitle>👤 Account Information</CardTitle>
        <Grid><Field label="Agency Name"><Inp defaultValue="Pioneer Placements Pvt. Ltd." /></Field><Field label="Email / Username"><ValidInp defaultValue="pioneer@placements.in" validate="email" /></Field></Grid>
        <Grid><Field label="Mobile"><ValidInp defaultValue="9876543210" validate="mobile" /></Field><Field label="State"><Sel options={['Maharashtra','Karnataka','Tamil Nadu']} /></Field></Grid>
        <div style={{ textAlign:'right' }}><Btn style={{ background:C.blue }}>💾 Save Changes</Btn></div>
      </Card>
      <Card style={{ marginBottom:18 }}>
        <CardTitle>🔒 Change Password</CardTitle>
        <Grid><Field label="Current Password"><Inp type="password" placeholder="Current password" /></Field><Field label="New Password"><Inp type="password" placeholder="New password" /></Field></Grid>
        <Field label="Confirm New Password"><Inp type="password" placeholder="Confirm new password" /></Field>
        <div style={{ textAlign:'right' }}><Btn style={{ background:C.blue }}>🔐 Update Password</Btn></div>
      </Card>
      <Card style={{ marginBottom:18 }}>
        <CardTitle>🔔 Notification Preferences</CardTitle>
        <Toggle label="New candidate application" sub="Notify when a candidate applies to your jobs" defaultChecked={true} />
        <Toggle label="Interview reminders" sub="Remind 24 hours before scheduled interviews" defaultChecked={true} />
        <Toggle label="Placement confirmed" sub="Notify when employer confirms a placement" defaultChecked={true} />
        <Toggle label="Incentive status updates" sub="Notify on claim approval / disbursal" defaultChecked={true} />
        <Toggle label="Employer demand requests" sub="Alert on new demand from employers" defaultChecked={true} />
        <Toggle label="Monthly report ready" sub="Notify when monthly report is generated" defaultChecked={false} />
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
      <div style={{ marginLeft:SW, marginTop:TH, padding:24, minHeight:`calc(100vh - ${TH}px)` }}>
        {renderPanel()}
      </div>
    </div>
  );
}
