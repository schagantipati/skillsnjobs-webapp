import { validate as fieldValidate, UPPERCASE_FIELDS as UPPERCASE_TYPES } from '../utils/validators.js';
import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

const SW = 250, TH = 58;
const C = {
  navy:'#0D2137', sidebar:'#1A56C4', blue:'#1E5FBF', teal:'#0B7B8C', green:'#1A7C3E',
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
  return <div style={{ background:'#fff', borderRadius:12, padding:18, border:'1px solid #e8ecf3', boxShadow:'0 1px 3px rgba(0,0,0,.05)' }}>
    <div style={{ fontSize:28, fontWeight:800, color: color||C.navy, lineHeight:1 }}>{val}</div>
    <div style={{ fontSize:12, color:'#64748b', marginTop:4 }}>{label}</div>
    <div style={{ fontSize:11, marginTop:2, fontWeight:600, color: color||C.blue }}>{sub}</div>
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
  return <div style={{ display:'flex', gap:12, padding:'10px 0', borderBottom:'1px solid #f0f2f5' }}>
    <div style={{ width:10, height:10, borderRadius:'50%', background:dot, flexShrink:0, marginTop:4 }} />
    <div>
      <div style={{ fontSize:13, fontWeight:600, color:C.navy }}>{title}</div>
      <div style={{ fontSize:11.5, color:'#94a3b8', marginTop:2 }}>{meta}</div>
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
  return <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 0', borderBottom:'1px solid #f0f2f5' }}>
    <div style={{ fontSize:18, fontWeight:800, color:C.navy, minWidth:52, flexShrink:0 }}>{n}</div>
    <div style={{ fontSize:12.5, color:'#374151', flex:1, minWidth:0 }}>{label}</div>
    <div style={{ minWidth:60, flex:'0 0 30%' }}>{ProgBar({pct, color})}</div>
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
  const [searchQ, setSearchQ] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef(null);

  function toggleMenu(id) { setOpenMenus(m => ({ ...m, [id]: !m[id] })); }
  function go(key) { setPanel(key); window.scrollTo(0, 0); }
  function handleLogout() { logout(); navigate('/login'); }

  const searchResults = searchQ.trim()
    ? NAV.filter(n => n.label.toLowerCase().includes(searchQ.toLowerCase()) || n.section.toLowerCase().includes(searchQ.toLowerCase())).slice(0, 8)
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
    function Sub({ id, children }) {
      return openMenus[id] ? <div style={{ background:'rgba(0,0,0,.12)' }}>{children}</div> : null;
    }
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
          <div style={{ width:34, height:34, background:C.green, borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>🏛️</div>
          <div>
            <div style={{ color:'#fff', fontWeight:800, fontSize:14, lineHeight:1.2 }}>SkillsNJobs</div>
            <div style={{ color:'rgba(255,255,255,.45)', fontSize:9.5 }}>CSR ORGANIZATION</div>
          </div>
        </div>

        {lbl('Main')}
        <NavItem icon="🏠" label="Dashboard" active={panel==='dashboard'} onClick={()=>go('dashboard')} />
        <NavItem icon="🔔" label="Notifications" badge="5" active={panel==='notifications'} onClick={()=>go('notifications')} />

        {lbl('CSR Profile')}
        <NavItem icon="🏢" label="Organisation Profile" id="profile" onClick={()=>toggleMenu('profile')} />
        <Sub id="profile">
          <SubItem label="Organisation Information" k="profile-info" />
          <SubItem label="Contact & Address" k="profile-contact" />
          <SubItem label="CSR Policy & Documents" k="profile-docs" />
          <SubItem label="Bank & Payment Details" k="profile-bank" />
        </Sub>

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
            🔔<span style={{ position:'absolute', top:2, right:2, width:17, height:17, borderRadius:'50%', background:C.red, color:'#fff', fontSize:10, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center' }}>5</span>
          </div>
          <div style={{ width:38, height:38, borderRadius:'50%', background:C.green, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:14 }}>CS</div>
          <div style={{ lineHeight:1.25 }}>
            <div style={{ fontWeight:700, fontSize:13.5 }}>{user?.org_name || 'Cipla Foundation'}</div>
            <div style={{ fontSize:11.5, color:'#64748b' }}>ID: CSR-000047</div>
          </div>
          <button onClick={handleLogout} style={{ background:C.blue, color:'#fff', border:'none', padding:'7px 16px', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer' }}>⏻ Sign Out</button>
        </div>
      </div>
    );
  }

  // ── PANELS ────────────────────────────────────────────────────────────────
  function PanelDashboard() {
    return <>
      <Alert icon="⚡" type="warn"><strong>Action needed:</strong> FY 2025-26 CSR-2 form submission due by 30 Sep 2026. <strong>File Now →</strong></Alert>
      <SectionHead title="Welcome, Cipla Foundation! 🏛️" />
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:20 }}>
        <KpiCard val="₹18.4 Cr" label="Total CSR Spend" sub="FY 2025-26" color={C.blue} />
        <KpiCard val="6,840" label="Beneficiaries Trained" sub="This year" color={C.teal} />
        <KpiCard val="12" label="Active Projects" sub="Across 8 states" color={C.green} />
        <KpiCard val="94%" label="Fund Utilization" sub="Of allocated corpus" color={C.gold} />
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
        {[['📋','Propose Project','proj-new'],['👥','Add Beneficiary','bene-register'],['💰','Disburse Funds','fund-disbursements'],['📜','File CSR-2','comp-csr2']].map(([icon,lbl,k])=>(
          <div key={k} onClick={()=>go(k)} style={{ background:'#fff', border:'1.5px solid #e8ecf3', borderRadius:12, padding:'18px 10px', textAlign:'center', cursor:'pointer' }}
            onMouseEnter={e=>{ e.currentTarget.style.borderColor=C.blue; e.currentTarget.style.background=C.pBlue; }}
            onMouseLeave={e=>{ e.currentTarget.style.borderColor='#e8ecf3'; e.currentTarget.style.background='#fff'; }}>
            <div style={{ fontSize:24, marginBottom:6 }}>{icon}</div>
            <div style={{ fontSize:12, fontWeight:600, color:C.navy }}>{lbl}</div>
          </div>
        ))}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:0 }}>
        <Card style={{ marginBottom:0 }}>
          <CardTitle>📊 CSR Spend vs Obligation</CardTitle>
          <StatRow n="₹18.4 Cr" label="Actual Spend" pct={92} color={C.green} />
          <StatRow n="₹20.0 Cr" label="Obligation (2% of PAT)" pct={100} color={C.blue} />
          <StatRow n="₹1.6 Cr" label="Unspent (to be transferred)" pct={8} color={C.red} />
          <hr style={{ border:'none', borderTop:'1px solid #e8ecf3', margin:'14px 0' }} />
          <div style={{ fontSize:12, color:'#64748b' }}>Sector: Healthcare 35% · Skill Dev 40% · Education 25%</div>
        </Card>
        <Card style={{ marginBottom:0, overflowX:'auto' }}>
          <CardTitle>🏆 Project Status</CardTitle>
          <Table head={['Project','Beneficiaries','Status']} rows={[
            ['Skill Dev — Navi Mumbai','1,200',<Badge color="green">Active</Badge>],
            ['Women Empowerment','840',<Badge color="green">Active</Badge>],
            ['Digital Literacy Drive','2,100',<Badge color="blue">Active</Badge>],
            ['Healthcare Outreach','620',<Badge color="gold">Review</Badge>],
            ['EV Technician Training','480',<Badge color="teal">Completed</Badge>],
          ]} />
        </Card>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginTop:16 }}>
        <Card style={{ marginBottom:0 }}>
          <CardTitle>🔔 Recent Activity</CardTitle>
          <TlItem dot={C.green} title="₹1.2 Cr disbursed to SkillBridge Institute" meta="Today · 10:45 AM" />
          <TlItem dot={C.blue} title="240 new beneficiaries enrolled in PMKVY batch" meta="Today · 9:00 AM" />
          <TlItem dot={C.gold} title="Board resolution for Q3 CSR expenditure uploaded" meta="Yesterday · 5:30 PM" />
          <TlItem dot={C.purple} title="Quarterly impact report generated" meta="Jul 3, 2026" />
          <TlItem dot={C.teal} title="MoU signed with TrainRight Academy, Jaipur" meta="Jul 2, 2026" />
        </Card>
        <Card style={{ marginBottom:0 }}>
          <CardTitle>📈 Beneficiary Funnel (This Year)</CardTitle>
          {[['8,400','Enrolled',100,C.blue],['7,920','Training Completed',94,C.teal],['6,840','Certified',81,C.green],['5,210','Placed',62,C.gold],['4,890','Retained (3-month)',58,C.purple]].map(([n,l,p,c])=>(
            <StatRow key={l} n={n} label={l} pct={p} color={c} />
          ))}
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
    return <>
      <Bc parts={['CSR Profile','Organisation Information']} />
      <SectionHead title="Organisation Information 🏢" />
      <Card>
        <CardTitle>🏛️ Basic Details</CardTitle>
        <Grid><Field label="Organisation Name"><Inp defaultValue="Cipla Limited" /></Field><Field label="CIN Number"><ValidInp defaultValue="L24239MH1935PLC002406" validate="cin" /></Field></Grid>
        <Grid><Field label="Organisation Type"><Sel options={['Public Limited Company','Private Limited Company','Government','Trust','Section 8 Company']} defaultValue="Public Limited Company" /></Field><Field label="Year of Incorporation"><Inp defaultValue="1935" /></Field></Grid>
        <Grid><Field label="PAN Number"><ValidInp defaultValue="AAACF0684J" validate="pan" /></Field><Field label="Category"><Sel options={['Manufacturing','Healthcare','Technology','FMCG','Banking & Finance']} defaultValue="Healthcare" /></Field></Grid>
        <Field label="Nature of Business"><Inp defaultValue="Pharmaceutical manufacturing and distribution" /></Field>
        <div style={{ textAlign:'right' }}><Btn>💾 Save Changes</Btn></div>
      </Card>
      <Card>
        <CardTitle>📊 CSR Obligation (FY 2025-26)</CardTitle>
        <Grid cols={3}><Field label="Avg Net Profit (3 yrs)"><Inp defaultValue="₹1,000 Cr" /></Field><Field label="2% CSR Obligation"><Inp defaultValue="₹20.0 Cr" /></Field><Field label="Total Spend"><Inp defaultValue="₹18.4 Cr" /></Field></Grid>
        <Alert icon="ℹ️" type="info">Unspent amount of ₹1.6 Cr must be transferred to a designated account within 6 months of FY end as per Section 135(6).</Alert>
      </Card>
    </>;
  }

  function PanelProfileContact() {
    return <>
      <Bc parts={['CSR Profile','Contact & Address']} />
      <SectionHead title="Contact & Address 📍" />
      <Card>
        <CardTitle>📞 Registered Office</CardTitle>
        <Field label="Street Address"><Inp defaultValue="Mumbai Central, Ganpatrao Kadam Marg" /></Field>
        <Grid cols={3}><Field label="City"><Inp defaultValue="Mumbai" /></Field><Field label="State"><Sel options={['Maharashtra','Delhi','Karnataka','Tamil Nadu']} defaultValue="Maharashtra" /></Field><Field label="PIN Code"><ValidInp defaultValue="400013" validate="pincode" /></Field></Grid>
        <Grid><Field label="CSR Helpline"><Inp defaultValue="1800-xxx-xxxx" /></Field><Field label="CSR Email"><Inp defaultValue="csr@cipla.com" /></Field></Grid>
        <div style={{ textAlign:'right' }}><Btn>💾 Save Changes</Btn></div>
      </Card>
      <Card>
        <CardTitle>👤 Nodal Officer</CardTitle>
        <Grid><Field label="Officer Name"><Inp defaultValue="Dr. Amrita Patel" /></Field><Field label="Designation"><Inp defaultValue="Head of CSR" /></Field></Grid>
        <Grid><Field label="Mobile"><ValidInp defaultValue="9876543210" validate="mobile" /></Field><Field label="Email"><ValidInp defaultValue="amrita.patel@cipla.com" validate="email" /></Field></Grid>
        <div style={{ textAlign:'right' }}><Btn>💾 Update Contact</Btn></div>
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
    return <>
      <Bc parts={['CSR Profile','Bank & Payment Details']} />
      <SectionHead title="Bank & Payment Details 🏦" />
      <Card>
        <CardTitle>🏦 Primary Bank Account</CardTitle>
        <Grid><Field label="Account Holder"><Inp defaultValue="Cipla Limited — CSR Fund" /></Field><Field label="Account Number"><Inp defaultValue="XXX-XXXX-XXXX-1234" /></Field></Grid>
        <Grid><Field label="IFSC Code"><ValidInp defaultValue="HDFC0001234" validate="ifsc" /></Field><Field label="Bank Name"><Inp defaultValue="HDFC Bank" /></Field></Grid>
        <Grid><Field label="Branch"><Inp defaultValue="Mumbai Central" /></Field><Field label="Account Type"><Sel options={['Current','Savings']} defaultValue="Current" /></Field></Grid>
        <Alert icon="⚠️" type="warn">Bank details once saved require OTP verification and board approval before changes take effect.</Alert>
        <div style={{ textAlign:'right' }}><Btn>💾 Save & Verify</Btn></div>
      </Card>
      <Card>
        <CardTitle>🏛️ Unspent CSR Fund Account</CardTitle>
        <Grid><Field label="Account Number"><Inp defaultValue="XXX-XXXX-XXXX-5678" /></Field><Field label="Bank"><Inp defaultValue="SBI — National Unspent CSR Fund" /></Field></Grid>
        <p style={{ fontSize:12.5, color:'#64748b', marginTop:8 }}>Designated for unspent CSR funds as per Section 135(6) of the Companies Act, 2013.</p>
      </Card>
    </>;
  }

  function PanelProjNew() {
    return <>
      <Bc parts={['Projects','Propose New Project']} />
      <SectionHead title="Propose New Project 📋" />
      <Card>
        <CardTitle>📝 Project Details</CardTitle>
        <Field label="Project Title"><Inp placeholder="e.g. Skill Development for Youth in Rural Maharashtra" /></Field>
        <Grid><Field label="Schedule VII Activity"><Sel options={['Eradicating Poverty','Promoting Education','Healthcare & Sanitation','Skill Development','Gender Equality','Environment','National Heritage','Sports','PM National Relief Fund']} /></Field><Field label="Sub-Sector"><Sel options={['Vocational Training','Literacy','Digital Skills','Financial Literacy']} /></Field></Grid>
        <Grid><Field label="Target Beneficiaries"><Inp placeholder="500" /></Field><Field label="Target States"><Inp placeholder="Maharashtra, Rajasthan" /></Field></Grid>
        <Grid><Field label="Start Date"><Inp type="date" /></Field><Field label="End Date"><Inp type="date" /></Field></Grid>
        <Field label="Project Objectives"><textarea className="inp" rows={3} placeholder="Describe objectives…" style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #dde2eb', borderRadius:8, fontSize:13.5, outline:'none', background:'#fafbfc', fontFamily:'inherit' }} /></Field>
      </Card>
      <Card>
        <CardTitle>💰 Financial Details</CardTitle>
        <Grid cols={3}><Field label="Estimated Budget (₹)"><Inp defaultValue="50,00,000" /></Field><Field label="Own Contribution (₹)"><Inp defaultValue="40,00,000" /></Field><Field label="Other Sources (₹)"><Inp defaultValue="10,00,000" /></Field></Grid>
        <Field label="Implementing Agency"><Inp placeholder="e.g. SkillBridge Institute Pvt. Ltd." /></Field>
        <Grid><Field label="Agency Type"><Sel options={['NGO','Training Institute','Government Body','Direct Implementation']} /></Field><Field label="MoU Signed"><Sel options={['Yes','No — in progress']} /></Field></Grid>
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:8 }}><Btn outline>Save Draft</Btn><Btn green>Submit for Approval</Btn></div>
      </Card>
    </>;
  }

  function PanelProjActive() {
    return <>
      <Bc parts={['Projects','Active Projects']} />
      <SectionHead title="Active Projects 🚀" />
      <Card>
        <Table head={['Project','State','Budget','Spent','Beneficiaries','Status']} rows={[
          ['Skill Dev — Navi Mumbai','Maharashtra','₹1.5 Cr','₹1.1 Cr (73%)','1,200',<Badge color="green">On Track</Badge>],
          ['Women Empowerment','Rajasthan','₹80 L','₹52 L (65%)','840',<Badge color="green">On Track</Badge>],
          ['Digital Literacy Drive','UP','₹2.0 Cr','₹1.6 Cr (80%)','2,100',<Badge color="blue">On Track</Badge>],
          ['Healthcare Outreach','Bihar','₹60 L','₹38 L (63%)','620',<Badge color="gold">Delayed</Badge>],
          ['EV Technician Training','Gujarat','₹1.2 Cr','₹0.7 Cr (58%)','480',<Badge color="green">On Track</Badge>],
          ['Agri-Tech Rural Program','Punjab','₹90 L','₹68 L (76%)','390',<Badge color="teal">On Track</Badge>],
        ]} />
      </Card>
    </>;
  }

  function PanelProjDraft() {
    return <>
      <Bc parts={['Projects','Draft Projects']} />
      <SectionHead title="Draft Projects 📝" />
      <Card>
        <Table head={['Title','Sector','Budget','Last Edited','Action']} rows={[
          ['Tribal Youth Coding Program','Education','₹40 L','Jul 3, 2026',<><Btn sm outline>Edit</Btn>{' '}<Btn sm green>Submit</Btn></>],
          ['Water Conservation — Vidarbha','Environment','₹70 L','Jun 28, 2026',<><Btn sm outline>Edit</Btn>{' '}<Btn sm green>Submit</Btn></>],
          ['Senior Care Skill Program','Healthcare','₹25 L','Jun 20, 2026',<><Btn sm outline>Edit</Btn>{' '}<Btn sm green>Submit</Btn></>],
        ]} />
        <div style={{ marginTop:14 }}><Btn>+ Propose New Project</Btn></div>
      </Card>
    </>;
  }

  function PanelProjCompleted() {
    return <>
      <Bc parts={['Projects','Completed Projects']} />
      <SectionHead title="Completed Projects ✅" />
      <Card>
        <Table head={['Project','Year','Beneficiaries','Fund Used','Impact Score','Certificate']} rows={[
          ['Digital Skills for Women','FY24-25','1,840','₹1.2 Cr',<Badge color="green">92/100</Badge>,<Btn sm outline>Download</Btn>],
          ['Rural Healthcare Training','FY24-25','960','₹80 L',<Badge color="green">87/100</Badge>,<Btn sm outline>Download</Btn>],
          ['Agri-Tech Pilot — Nashik','FY23-24','540','₹45 L',<Badge color="blue">78/100</Badge>,<Btn sm outline>Download</Btn>],
          ['EV Technician Batch 1','FY23-24','320','₹38 L',<Badge color="teal">95/100</Badge>,<Btn sm outline>Download</Btn>],
        ]} />
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
    return <>
      <Bc parts={['Beneficiaries','Register Beneficiary']} />
      <SectionHead title="Register Beneficiary 👤" />
      <Card>
        <CardTitle>📋 Personal Details</CardTitle>
        <Grid><Field label="Full Name"><Inp placeholder="e.g. Ramesh Kumar" /></Field><Field label="Date of Birth"><Inp type="date" /></Field></Grid>
        <Grid><Field label="Gender"><Sel options={['Male','Female','Transgender']} /></Field><Field label="Category"><Sel options={['General','OBC','SC','ST','Minority','Differently Abled']} /></Field></Grid>
        <Grid><Field label="Aadhaar Number"><ValidInp placeholder="XXXX XXXX XXXX" validate="aadhaar" /></Field><Field label="Mobile"><ValidInp placeholder="9XXXXXXXXX" validate="mobile" /></Field></Grid>
        <Grid><Field label="State / UT"><Sel options={['Maharashtra','Rajasthan','Uttar Pradesh','Bihar','Gujarat','Punjab']} /></Field><Field label="Email (optional)"><ValidInp placeholder="email@example.com" validate="email" /></Field></Grid>
      </Card>
      <Card>
        <CardTitle>🎓 Training Enrollment</CardTitle>
        <Grid><Field label="Project"><Sel options={['Skill Dev — Navi Mumbai','Women Empowerment — Rajasthan','Digital Literacy — UP']} /></Field><Field label="Training Partner"><Sel options={['SkillBridge Institute','TrainRight Academy','TechLearn Pvt Ltd']} /></Field></Grid>
        <Grid><Field label="Course / Trade"><Sel options={['Data Entry Operator','BPO Associate','Retail Sales','Healthcare Worker','Electrician']} /></Field><Field label="Batch Code"><Inp placeholder="e.g. PMKVY-NM-2026-B3" /></Field></Grid>
        <Grid><Field label="Enrollment Date"><Inp type="date" /></Field><Field label="Expected Completion"><Inp type="date" /></Field></Grid>
        <div style={{ textAlign:'right' }}><Btn green>+ Register Beneficiary</Btn></div>
      </Card>
    </>;
  }

  function PanelBeneList() {
    return <>
      <Bc parts={['Beneficiaries','Beneficiary List']} />
      <SectionHead title="Beneficiary List 👥" />
      <Card>
        <Table head={['Name','Gender','State','Project','Status','Batch']} rows={[
          ['Ramesh Kumar','M','Maharashtra','Skill Dev — NM',<Badge color="blue">In Training</Badge>,'PMKVY-NM-2026-B3'],
          ['Sunita Devi','F','Rajasthan','Women Empowerment',<Badge color="green">Certified</Badge>,'WE-RJ-2026-B1'],
          ['Amit Singh','M','UP','Digital Literacy',<Badge color="teal">Enrolled</Badge>,'DL-UP-2026-B5'],
          ['Priya Verma','F','Bihar','Healthcare Outreach',<Badge color="purple">Placed</Badge>,'HO-BR-2025-B2'],
          ['Deepak Yadav','M','Gujarat','EV Technician',<Badge color="blue">In Training</Badge>,'EV-GJ-2026-B1'],
        ]} />
        <div style={{ marginTop:12, fontSize:12, color:'#64748b' }}>Total: 6,840 beneficiaries | Showing 1–5</div>
      </Card>
    </>;
  }

  function PanelBeneTrack() {
    return <>
      <Bc parts={['Beneficiaries','Track Progress']} />
      <SectionHead title="Track Progress 📈" />
      <Card>
        <CardTitle>📊 Overall Beneficiary Funnel</CardTitle>
        {[['8,400','Enrolled',100,C.blue],['7,920','Training In Progress',94,C.teal],['6,840','Certified',81,C.green],['5,210','Placed',62,C.gold],['4,890','Retained (3-month)',58,C.purple]].map(([n,l,p,c])=>(
          <StatRow key={l} n={n} label={l} pct={p} color={c} />
        ))}
      </Card>
      <Card>
        <CardTitle>📌 Project-wise Progress</CardTitle>
        <Table head={['Project','Enrolled','Certified','Placed','Completion %']} rows={[
          ['Skill Dev — Navi Mumbai','1,200','1,080','920',<Badge color="green">90%</Badge>],
          ['Women Empowerment','840','760','680',<Badge color="green">90%</Badge>],
          ['Digital Literacy Drive','2,100','1,890','1,200',<Badge color="blue">90%</Badge>],
          ['Healthcare Outreach','620','480','320',<Badge color="gold">77%</Badge>],
        ]} />
      </Card>
    </>;
  }

  function PanelBenePlacement() {
    return <>
      <Bc parts={['Beneficiaries','Placement Outcomes']} />
      <SectionHead title="Placement Outcomes 🎯" />
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:14, marginBottom:16 }}>
        <KpiCard val="4,890" label="Total Placed" sub="FY 2025-26" color={C.green} />
        <KpiCard val="76%" label="Placement Rate" sub="Of certified candidates" color={C.blue} />
        <KpiCard val="₹14,200" label="Avg Monthly CTC" sub="Entry-level jobs" color={C.teal} />
        <KpiCard val="94%" label="Retention (3-month)" sub="Of placed candidates" color={C.purple} />
      </div>
      <Card>
        <CardTitle>🏆 Sector-wise Placements</CardTitle>
        <Table head={['Sector','Placed','Avg CTC','Top Employer']} rows={[
          ['IT-ITES / BPO','1,240',<Badge color="blue">₹12,000</Badge>,'Wipro BPO'],
          ['Healthcare / Pharma','820',<Badge color="teal">₹11,500</Badge>,'Apollo Hospitals'],
          ['Retail / Sales','740',<Badge color="green">₹10,800</Badge>,'BigBazaar'],
          ['EV / Manufacturing','480',<Badge color="purple">₹14,500</Badge>,'Ola Electric'],
          ['Hospitality','360',<Badge color="gold">₹9,500</Badge>,'OYO Hotels'],
        ]} />
      </Card>
    </>;
  }

  function PanelTpList() {
    return <>
      <Bc parts={['Training Partners','Empanelled Partners']} />
      <SectionHead title="Empanelled Training Partners 🎓" />
      <Card>
        <Table head={['Partner','Type','State','Beneficiaries','Rating','Status']} rows={[
          ['SkillBridge Institute','Private ITC','Maharashtra',<Badge color="blue">1,200</Badge>,'⭐ 4.7',<Badge color="green">Active</Badge>],
          ['TrainRight Academy','NGO','Rajasthan',<Badge color="blue">840</Badge>,'⭐ 4.5',<Badge color="green">Active</Badge>],
          ['TechLearn Pvt Ltd','Private','UP',<Badge color="blue">2,100</Badge>,'⭐ 4.3',<Badge color="blue">Active</Badge>],
          ['HealSkill Foundation','NGO','Bihar',<Badge color="blue">620</Badge>,'⭐ 4.1',<Badge color="gold">Review</Badge>],
          ['EV Academy India','Private','Gujarat',<Badge color="blue">480</Badge>,'⭐ 4.9',<Badge color="teal">Active</Badge>],
        ]} />
        <div style={{ marginTop:14 }}><Btn>+ Add New Partner</Btn></div>
      </Card>
    </>;
  }

  function PanelTpAdd() {
    return <>
      <Bc parts={['Training Partners','Add Training Partner']} />
      <SectionHead title="Add Training Partner ➕" />
      <Card>
        <Grid><Field label="Organisation Name"><Inp /></Field><Field label="Type"><Sel options={['Private ITC','Government ITI','NGO','Society','Trust','Private Company']} /></Field></Grid>
        <Grid><Field label="NSDC Registration No."><Inp /></Field><Field label="State"><Sel options={['Maharashtra','Rajasthan','UP','Bihar','Gujarat','Punjab']} /></Field></Grid>
        <Grid><Field label="Contact Person"><Inp /></Field><Field label="Email"><ValidInp type="email" validate="email" /></Field></Grid>
        <Grid><Field label="No. of Trainers"><Inp defaultValue="10" /></Field><Field label="Max Batch Size"><Inp defaultValue="30" /></Field></Grid>
        <div style={{ textAlign:'right' }}><Btn green>+ Add Partner</Btn></div>
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
    return <>
      <Bc parts={['Funds','Disbursements']} />
      <SectionHead title="Disbursements 📤" />
      <Card>
        <CardTitle>➕ New Disbursement Request</CardTitle>
        <Grid><Field label="Project"><Sel options={['Skill Dev — Navi Mumbai','Women Empowerment','Digital Literacy Drive','Healthcare Outreach']} /></Field><Field label="Training Partner"><Sel options={['SkillBridge Institute','TrainRight Academy','TechLearn Pvt Ltd']} /></Field></Grid>
        <Grid cols={3}><Field label="Amount (₹)"><Inp placeholder="e.g. 50,00,000" /></Field><Field label="Payment Date"><Inp type="date" /></Field><Field label="Mode"><Sel options={['NEFT','RTGS','Cheque','UPI']} /></Field></Grid>
        <Field label="Purpose / Milestone"><Inp placeholder="e.g. Batch 3 training completion payment" /></Field>
        <div style={{ textAlign:'right' }}><Btn green>Submit Disbursement Request</Btn></div>
      </Card>
      <Card>
        <CardTitle>📋 Recent Disbursements</CardTitle>
        <Table head={['Date','Project','Partner','Amount','Mode','Status']} rows={[
          ['Jul 4, 2026','Skill Dev — NM','SkillBridge','₹1.20 Cr','RTGS',<Badge color="green">Completed</Badge>],
          ['Jun 28, 2026','Digital Literacy','TechLearn','₹80 L','NEFT',<Badge color="green">Completed</Badge>],
          ['Jun 20, 2026','Women Empowerment','TrainRight','₹40 L','NEFT',<Badge color="green">Completed</Badge>],
          ['Jun 15, 2026','Healthcare Outreach','HealSkill','₹20 L','Cheque',<Badge color="gold">Pending</Badge>],
        ]} />
      </Card>
    </>;
  }

  function PanelFundUtilization() {
    return <>
      <Bc parts={['Funds','Utilization Reports']} />
      <SectionHead title="Utilization Reports 📊" />
      <Card>
        <Table head={['Quarter','Planned','Actual Spend','Variance','Status']} rows={[
          ['Q1 (Apr–Jun 2025)','₹4.0 Cr','₹3.6 Cr','−₹0.4 Cr',<Badge color="gold">Under Utilized</Badge>],
          ['Q2 (Jul–Sep 2025)','₹5.0 Cr','₹5.2 Cr','+₹0.2 Cr',<Badge color="green">On Track</Badge>],
          ['Q3 (Oct–Dec 2025)','₹5.5 Cr','₹5.4 Cr','−₹0.1 Cr',<Badge color="green">On Track</Badge>],
          ['Q4 (Jan–Mar 2026)','₹5.5 Cr','₹4.2 Cr','−₹1.3 Cr',<Badge color="red">Short Spend</Badge>],
        ]} />
        <div style={{ marginTop:14, display:'flex', gap:10 }}><Btn outline>📥 Download Q4 Report</Btn><Btn>📊 Full Year Report</Btn></div>
      </Card>
    </>;
  }

  function PanelFundUnspent() {
    return <>
      <Bc parts={['Funds','Unspent CSR Funds']} />
      <SectionHead title="Unspent CSR Funds ⚠️" />
      <Alert icon="⚠️" type="warn"><strong>₹1.6 Cr unspent</strong> for FY 2025-26 must be transferred to an Ongoing Project Account or PM National Relief Fund by <strong>30 Sep 2026</strong> under Section 135(6).</Alert>
      <Card>
        <Grid><Field label="Financial Year"><Inp defaultValue="FY 2025-26" /></Field><Field label="Unspent Amount"><Inp defaultValue="₹1.60 Cr" /></Field></Grid>
        <Grid><Field label="Reason"><Sel options={['Project Delays','Vendor Issues','Regulatory Hold','Planning Gap']} /></Field><Field label="Transfer Deadline"><Inp defaultValue="Sep 30, 2026" /></Field></Grid>
        <Field label="Transfer Destination"><Sel options={['Designated Unspent CSR Fund Account','PM National Relief Fund','PM CARES Fund','Ongoing CSR Projects']} /></Field>
        <Field label="Remediation Plan"><textarea className="inp" rows={3} placeholder="Describe plan…" style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #dde2eb', borderRadius:8, fontSize:13.5, outline:'none', background:'#fafbfc', fontFamily:'inherit' }} /></Field>
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}><Btn>💾 Save Plan</Btn><Btn green>📤 Initiate Transfer</Btn></div>
      </Card>
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
        <Table head={['Employer Partner','Apprentices','Monthly Stipend','Govt Share','Status']} rows={[
          ['Cipla Ltd (Internal)','120','₹6,000','₹1,500',<Badge color="green">Active</Badge>],
          ['TechNova Ltd','40','₹7,000','₹1,500',<Badge color="blue">Active</Badge>],
        ]} />
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
    return <>
      <Bc parts={['Account','Account Preferences']} />
      <SectionHead title="Account Preferences ⚙️" />
      <Card>
        <CardTitle>👤 Account Information</CardTitle>
        <Grid><Field label="Organisation Name"><Inp defaultValue={user?.org_name || 'Cipla Foundation'} /></Field><Field label="Email / Username"><ValidInp defaultValue={user?.email || 'csr@cipla.com'} validate="email" /></Field></Grid>
        <Grid><Field label="Mobile"><ValidInp defaultValue="9876543210" validate="mobile" /></Field><Field label="State"><Sel options={['Maharashtra','Delhi','Karnataka','Tamil Nadu']} defaultValue="Maharashtra" /></Field></Grid>
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
        <Toggle label="Project approval updates" sub="Notify when a project is approved or requires changes" defaultChecked={true} />
        <Toggle label="Fund disbursement alerts" sub="Notify on disbursement requests and completions" defaultChecked={true} />
        <Toggle label="Compliance reminders" sub="Remind about CSR-2 filing and unspent fund deadlines" defaultChecked={true} />
        <Toggle label="Beneficiary milestone alerts" sub="Notify on batch completion and certification" defaultChecked={true} />
        <Toggle label="Partner performance reports" sub="Monthly partner performance digest" defaultChecked={false} />
        <Toggle label="Annual report generation" sub="Notify when annual impact report is ready" defaultChecked={true} />
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
      <div style={{ marginLeft:SW, marginTop:TH, padding:24, minHeight:`calc(100vh - ${TH}px)`, overflowX:'hidden', boxSizing:'border-box' }}>
        {renderPanel()}
      </div>
    </div>
  );
}
