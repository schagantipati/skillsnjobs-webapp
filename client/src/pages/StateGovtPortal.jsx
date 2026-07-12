import React, { useState, useEffect, useCallback } from 'react';
import { validate as fieldValidate, validatePositiveNum } from '../utils/validators.js';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api.js';
import AccountPreferences from '../components/AccountPreferences.jsx';

const CSS = `
*{box-sizing:border-box;margin:0;padding:0}
.sg-shell{font-family:'Segoe UI',Arial,sans-serif;background:#F0F4F8;color:#1A2B4A;display:flex;height:100vh;overflow:hidden}
/* SIDEBAR */
.sg-sidebar{width:220px;min-width:220px;background:#010E3C;display:flex;flex-direction:column;height:100vh;overflow:hidden;transition:.25s;flex-shrink:0}
.sg-sidebar-nav{flex:1;overflow-y:auto;padding-bottom:8px}
.sg-sidebar-nav::-webkit-scrollbar{width:4px}
.sg-sidebar-nav::-webkit-scrollbar-thumb{background:rgba(255,255,255,.2);border-radius:4px}
.sg-brand{padding:0 16px;height:58px;display:flex;flex-direction:column;justify-content:center;border-bottom:1px solid rgba(255,255,255,.12)}
.sg-brand-top{display:flex;align-items:center;gap:10px;margin-bottom:8px}
.sg-logo{width:36px;height:36px;background:#FF6B00;border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:15px;color:#fff;flex-shrink:0}
.sg-brand-name{font-size:13px;font-weight:800;color:#fff;line-height:1.2}
.sg-brand-sub{font-size:9.5px;color:rgba(255,255,255,.6)}
.sg-state-badge{background:rgba(255,255,255,.1);border-radius:6px;padding:7px 10px;display:flex;align-items:center;gap:8px}
.sg-state-info{flex:1}
.sg-state-name{font-size:11.5px;font-weight:700;color:#fff}
.sg-state-role{font-size:9.5px;color:rgba(255,255,255,.6)}
.sg-online{width:7px;height:7px;background:#22C55E;border-radius:50%;flex-shrink:0}
.sg-section{padding:10px 10px 4px;font-size:9px;font-weight:700;color:rgba(255,255,255,.4);letter-spacing:.8px;text-transform:uppercase;margin-top:4px}
.sg-item{display:flex;align-items:center;gap:9px;padding:8px 12px;margin:1px 8px;border-radius:7px;cursor:pointer;color:rgba(255,255,255,.8);font-size:12.5px;font-weight:500;user-select:none;transition:.15s;position:relative}
.sg-item:hover{background:rgba(255,255,255,.1);color:#fff}
.sg-item.active{background:rgba(255,255,255,.18);color:#fff;font-weight:700}
.sg-item.active::before{content:'';position:absolute;left:0;top:50%;transform:translateY(-50%);width:3px;height:60%;background:#FF6B00;border-radius:2px}
.sg-item .ic{font-size:15px;width:18px;text-align:center;flex-shrink:0}
.sg-item .lbl{flex:1}
.sg-item .badge{background:#FF6B00;color:#fff;font-size:9px;font-weight:700;padding:2px 6px;border-radius:10px;min-width:18px;text-align:center}
.sg-item .chev{font-size:10px;color:rgba(255,255,255,.4);transition:.2s}
.sg-item.open .chev{transform:rotate(90deg)}
.sg-children{overflow:hidden;max-height:0;transition:max-height .3s ease}
.sg-children.open{max-height:500px}
.sg-child{display:flex;align-items:center;gap:8px;padding:6px 12px 6px 40px;margin:1px 8px;border-radius:7px;cursor:pointer;color:rgba(255,255,255,.65);font-size:11.5px;transition:.15s}
.sg-child:hover{background:rgba(255,255,255,.08);color:#fff}
.sg-child.active{color:#FF6B00;font-weight:600}
.sg-child .dot{width:5px;height:5px;background:rgba(255,255,255,.3);border-radius:50%;flex-shrink:0}
.sg-child.active .dot{background:#FF6B00}
.sg-footer{padding:12px;border-top:1px solid rgba(255,255,255,.12);flex-shrink:0}
.sg-user{display:flex;align-items:center;gap:10px}
.sg-avatar{width:34px;height:34px;background:#FF6B00;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;color:#fff;flex-shrink:0}
.sg-uname{font-size:12px;font-weight:700;color:#fff}
.sg-urole{font-size:10px;color:rgba(255,255,255,.5)}
/* TOPBAR */
.sg-main{flex:1;display:flex;flex-direction:column;overflow:hidden}
.sg-topbar{background:#fff;border-bottom:1px solid #E2E8F0;padding:0 24px;height:54px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0}
.sg-tb-left{display:flex;align-items:center;gap:8px;font-size:12px;color:#94A3B8}
.sg-tb-crumb{color:#1A2B4A;font-weight:700;font-size:14px}
.sg-tb-right{display:flex;align-items:center;gap:10px}
.sg-tb-btn{display:flex;align-items:center;gap:6px;padding:6px 12px;border:1.5px solid #E2E8F0;border-radius:7px;background:#fff;cursor:pointer;font-size:12px;color:#3D5170;font-weight:500;transition:.15s}
.sg-tb-btn:hover{border-color:#003087;color:#003087}
.sg-tb-icon{width:34px;height:34px;border:1.5px solid #E2E8F0;border-radius:7px;background:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:15px;position:relative;transition:.15s}
.sg-tb-icon:hover{border-color:#003087}
.notif-dot{position:absolute;top:4px;right:4px;width:8px;height:8px;background:#FF6B00;border-radius:50%;border:1.5px solid #fff}
.sg-scheme-tag{background:#EFF6FF;color:#003087;font-size:11px;font-weight:700;padding:5px 10px;border-radius:6px}
/* CONTENT */
.sg-content{flex:1;overflow-y:auto;padding:20px 24px}
.sg-content::-webkit-scrollbar{width:5px}
.sg-content::-webkit-scrollbar-thumb{background:#CBD5E1;border-radius:4px}
/* Components */
.sg-ph{margin-bottom:18px}
.sg-ph h1{font-size:20px;font-weight:800;color:#1A2B4A}
.sg-ph p{font-size:12px;color:#6B7FA3;margin-top:3px}
.sg-kpi-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px;margin-bottom:18px}
.sg-kpi{background:#fff;border-radius:10px;padding:14px 16px;border-top:3px solid var(--c,#003087);box-shadow:0 1px 3px rgba(0,0,0,.06)}
.sg-kpi .val{font-size:22px;font-weight:800;color:var(--c,#003087);line-height:1}
.sg-kpi .lbl{font-size:10.5px;color:#6B7FA3;margin-top:4px}
.sg-kpi .delta{font-size:9.5px;color:#22C55E;margin-top:2px;font-weight:600}
.sg-kpi .delta.neg{color:#EF4444}
.sg-card{background:#fff;border-radius:10px;padding:16px;box-shadow:0 1px 3px rgba(0,0,0,.06);margin-bottom:14px}
.sg-card-title{font-size:13px;font-weight:700;color:#1A2B4A;margin-bottom:12px}
.sg-grid2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.sg-grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px}
table{width:100%;border-collapse:collapse;font-size:12px}
th{text-align:left;padding:8px 10px;background:#F8FAFC;color:#6B7FA3;font-size:10.5px;font-weight:600;border-bottom:1px solid #E2E8F0;white-space:nowrap}
td{padding:8px 10px;border-bottom:1px solid #F1F5F9;color:#1A2B4A;vertical-align:middle}
tr:last-child td{border-bottom:none}
tr:hover td{background:#FAFBFD}
.pill{display:inline-block;padding:3px 8px;border-radius:20px;font-size:9.5px;font-weight:700;white-space:nowrap}
.pill.green{background:#DCFCE7;color:#166534}
.pill.amber{background:#FEF9C3;color:#854D0E}
.pill.red{background:#FEE2E2;color:#991B1B}
.pill.blue{background:#DBEAFE;color:#1E40AF}
.pill.purple{background:#F3E8FF;color:#6B21A8}
.pill.gray{background:#F1F5F9;color:#475569}
.pill.orange{background:#FFF7ED;color:#9A3412}
.sg-prog-bar{height:6px;background:#F1F5F9;border-radius:4px;overflow:hidden;margin-top:4px}
.sg-prog-fill{height:100%;border-radius:4px}
.sg-stat-row{display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid #F1F5F9;font-size:12px}
.sg-stat-row:last-child{border-bottom:none}
.sg-stat-row .lbl{color:#6B7FA3}
.sg-stat-row .val{font-weight:700}
.sg-btn{padding:6px 12px;border-radius:6px;font-size:11.5px;font-weight:600;cursor:pointer;border:none;transition:.15s}
.sg-btn-primary{background:#003087;color:#fff}.sg-btn-primary:hover{background:#001e5a}
.sg-btn-orange{background:#FF6B00;color:#fff}.sg-btn-orange:hover{background:#e55c00}
.sg-btn-outline{background:#fff;color:#003087;border:1.5px solid #003087}.sg-btn-outline:hover{background:#EFF6FF}
.sg-btn-teal{background:#0D9488;color:#fff}.sg-btn-teal:hover{background:#0f766e}
.sg-btn-danger{background:#EF4444;color:#fff}.sg-btn-danger:hover{background:#dc2626}
.sg-btn-sm{padding:4px 9px;font-size:10.5px}
.sg-alert{display:flex;align-items:center;gap:10px;padding:9px 14px;border-radius:7px;margin-bottom:12px;font-size:12px}
.sg-alert.red{background:#FEE2E2;color:#991B1B}
.sg-alert.amber{background:#FEF9C3;color:#854D0E}
.sg-alert.blue{background:#DBEAFE;color:#1E40AF}
.sg-alert.green{background:#DCFCE7;color:#166534}
.sg-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.sg-form-group{display:flex;flex-direction:column;gap:4px}
.sg-form-group label{font-size:11px;font-weight:600;color:#475569}
.sg-form-group input,.sg-form-group select,.sg-form-group textarea{padding:7px 10px;border:1.5px solid #E2E8F0;border-radius:6px;font-size:12px;color:#1A2B4A;background:#fff;outline:none;transition:.15s}
.sg-form-group input:focus,.sg-form-group select:focus{border-color:#003087}
.sg-tl{padding-left:16px;border-left:2px solid #E2E8F0}
.sg-tl-item{padding-bottom:14px;position:relative}
.sg-tl-item::before{content:'';position:absolute;left:-20px;top:4px;width:8px;height:8px;background:#003087;border-radius:50%;border:2px solid #fff;box-shadow:0 0 0 2px #003087}
.sg-tl-time{font-size:9.5px;color:#94A3B8}
.sg-tl-text{font-size:12px;color:#1A2B4A;margin-top:2px}
.sg-tl-meta{font-size:10px;color:#6B7FA3;margin-top:1px}
.sg-empty{text-align:center;padding:48px;color:#94A3B8}
.sg-empty .icon{font-size:40px;margin-bottom:12px}
.sg-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;z-index:1000}
.sg-modal{background:#fff;border-radius:12px;padding:24px;width:520px;max-width:95vw;max-height:90vh;overflow-y:auto}
.sg-modal-title{font-size:15px;font-weight:800;color:#1A2B4A;margin-bottom:18px;display:flex;justify-content:space-between;align-items:center}
.sg-modal-actions{display:flex;gap:8px;justify-content:flex-end;margin-top:16px}
`;

const CRUMBS = {
  dashboard:'Dashboard', notifications:'Notifications', 'live-analytics':'Live Analytics',
  pmkvy:'PMKVY 4.0', 'ddu-gky':'DDU-GKY', naps:'NAPS', 'state-scheme':'State Scheme', 'csr-programs':'CSR Programs',
  targets:'Targets & Allocation', financial:'Financial Management',
  'tp-list':'Training Partners', 'tp-onboard':'TP Onboarding', 'tp-verify':'Accreditation',
  'candidate-list':'All Beneficiaries', enrolment:'Enrolment', placements:'Placements', dropouts:'Dropouts',
  'cert-verify':'Certificate Verification', grievances:'Grievance Redressal',
  sectors:'Sector-wise Data', employers:'Employer Partners',
  'mis-monthly':'Monthly MIS', 'mis-district':'District Report', 'mis-scheme':'Scheme Report',
  'tc-list':'Training Centres', 'tc-map':'District Map View',
  'trainer-list':'Trainer Registry', 'assessor-list':'Assessor Registry',
  'audit-logs':'Audit Logs', users:'User Management', settings:'Settings',
};

function pill(val, map) {
  const cls = map[val] || 'gray';
  return <span className={`pill ${cls}`}>{val}</span>;
}

// ── Loading skeleton ──
function Skeleton() {
  return (
    <div style={{ padding: '20px 0' }}>
      {[1, 2, 3].map(i => (
        <div key={i} style={{ height: 16, background: '#F1F5F9', borderRadius: 6, marginBottom: 10, width: `${80 - i * 10}%`, animation: 'pulse 1.5s infinite' }} />
      ))}
    </div>
  );
}

// ── Modal wrapper ──
function Modal({ title, onClose, children }) {
  return (
    <div className="sg-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="sg-modal">
        <div className="sg-modal-title">
          <span>{title}</span>
          <button className="sg-btn sg-btn-outline sg-btn-sm" onClick={onClose}>✕ Close</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function StateGovtPortal() {
  const { user, logout } = useAuth();
  const routerNavigate = useNavigate();
  const [activePanel, setActivePanel] = useState('dashboard');
  const [openMenus, setOpenMenus] = useState({});
  const [stats, setStats] = useState(null);
  const [modal, setModal] = useState(null);
  const [tps, setTps] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [grievances, setGrievances] = useState([]);
  const [disbursements, setDisbursements] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [mis, setMis] = useState([]);
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({});
  const [toast, setToast] = useState(null);
  const [certNo, setCertNo] = useState('');
  const [certResult, setCertResult] = useState(null);
  const [certErr, setCertErr] = useState('');
  const [auditLogs, setAuditLogs] = useState([]);
  const [portalUsers, setPortalUsers] = useState([]);
  const [allBatches, setAllBatches] = useState([]);

  const showToast = (msg, type = 'green') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadStats = useCallback(async () => {
    try { const s = await api.sgStats(); setStats(s); } catch {}
  }, []);

  useEffect(() => {
    loadStats();
    api.allBatches().then(b => setAllBatches(Array.isArray(b) ? b : [])).catch(() => {});
  }, [loadStats]);

  const NEEDS_CANDIDATES = new Set(['candidate-list','enrolment','placements','dropouts','sectors','employers','live-analytics','pmkvy','ddu-gky','naps','state-scheme','csr-programs','mis-district']);
  const NEEDS_TPS = new Set(['tp-list','tp-onboard','tp-verify','tc-list','tc-map','trainer-list','assessor-list','enrolment','pmkvy','ddu-gky','naps','state-scheme','csr-programs']);
  const NEEDS_GRIEVANCES = new Set(['grievances','live-analytics']);
  const NEEDS_DISBURSEMENTS = new Set(['financial','live-analytics']);

  const navigate = (panel) => {
    setActivePanel(panel);
    if (NEEDS_TPS.has(panel) && tps.length === 0) loadTPs();
    if (NEEDS_CANDIDATES.has(panel) && candidates.length === 0) loadCandidates();
    if (NEEDS_GRIEVANCES.has(panel) && grievances.length === 0) loadGrievances();
    if (NEEDS_DISBURSEMENTS.has(panel) && disbursements.length === 0) loadDisbursements();
    if (panel === 'notifications') loadNotifications();
    if (panel === 'mis-scheme') loadMis();
    if (panel === 'mis-monthly') { if (candidates.length === 0) loadCandidates(); }
    if (panel === 'targets') loadTargets();
    if (panel === 'audit-logs') loadAuditLogs();
    if (panel === 'users') loadPortalUsers();
  };

  const loadTPs = async () => { setLoading(true); try { setTps(await api.sgTPs()); } catch {} setLoading(false); };
  const loadCandidates = async () => { setLoading(true); try { setCandidates(await api.sgCandidates()); } catch {} setLoading(false); };
  const loadGrievances = async () => { setLoading(true); try { setGrievances(await api.sgGrievances()); } catch {} setLoading(false); };
  const loadDisbursements = async () => { setLoading(true); try { const d = await api.sgDisbursements(); setDisbursements(d.disbursements || []); } catch {} setLoading(false); };
  const loadNotifications = async () => { setLoading(true); try { setNotifications(await api.sgNotifications()); } catch {} setLoading(false); };
  const loadMis = async () => { setLoading(true); try { setMis(await api.sgMis()); } catch {} setLoading(false); };
  const loadTargets = async () => { try { setTargets(await api.sgTargets()); } catch {} };
  const loadAuditLogs = async () => { try { const r = await api.auditLogs({ limit: 50 }); setAuditLogs(Array.isArray(r) ? r : (r.logs || [])); } catch {} };
  const loadPortalUsers = async () => { try { setPortalUsers(await api.usersByRole('state_government')); } catch {} };

  const toggleMenu = (key) => setOpenMenus(p => ({ ...p, [key]: !p[key] }));

  const Nav = ({ id, icon, label, badge, children, menuKey }) => {
    if (children) {
      return (
        <>
          <div className={`sg-item${openMenus[menuKey] ? ' open' : ''}`} onClick={() => toggleMenu(menuKey)}>
            <span className="ic">{icon}</span><span className="lbl">{label}</span><span className="chev">›</span>
          </div>
          <div className={`sg-children${openMenus[menuKey] ? ' open' : ''}`}>{children}</div>
        </>
      );
    }
    return (
      <div className={`sg-item${activePanel === id ? ' active' : ''}`} onClick={() => navigate(id)}>
        <span className="ic">{icon}</span><span className="lbl">{label}</span>
        {badge > 0 && <span className="badge">{badge}</span>}
      </div>
    );
  };

  const Child = ({ id, label }) => (
    <div className={`sg-child${activePanel === id ? ' active' : ''}`} onClick={() => navigate(id)}>
      <span className="dot" />{label}
    </div>
  );

  // ══ PANELS ══

  const renderDashboard = () => {
    if (!stats) return <Skeleton />;
    const certRate = stats.certRate || 0;
    const placementRate = stats.placementRate || 0;
    return (
      <>
        <div className="sg-ph"><h1>State Dashboard</h1><p>Skill India Digital · {user?.org_name || 'State Government'} · Real-time Overview</p></div>
        {stats.grievOpen > 0 && (
          <div className="sg-alert amber">⚠️ <strong>{stats.grievOpen} open grievances</strong> require attention. <span style={{ cursor: 'pointer', fontWeight: 700, textDecoration: 'underline' }} onClick={() => navigate('grievances')}>Review Now →</span></div>
        )}
        <div className="sg-kpi-grid">
          <div className="sg-kpi" style={{ '--c': '#003087' }}><div className="val">{stats.candTotal?.toLocaleString() || 0}</div><div className="lbl">Total Enrolled</div></div>
          <div className="sg-kpi" style={{ '--c': '#007B5E' }}><div className="val">{stats.candCertified?.toLocaleString() || 0}</div><div className="lbl">Certified</div><div className="delta">{certRate}% cert rate</div></div>
          <div className="sg-kpi" style={{ '--c': '#FF6B00' }}><div className="val">{stats.candPlaced?.toLocaleString() || 0}</div><div className="lbl">Placed</div><div className="delta">{placementRate}% placement rate</div></div>
          <div className="sg-kpi" style={{ '--c': '#7C3AED' }}><div className="val">{stats.tpActive || 0}</div><div className="lbl">Active Training Partners</div></div>
          <div className="sg-kpi" style={{ '--c': '#0891B2' }}><div className="val">{stats.tpCount || 0}</div><div className="lbl">Total TPs</div><div className="delta delta.neg">{stats.tpPending || 0} pending</div></div>
          <div className="sg-kpi" style={{ '--c': '#DC2626' }}><div className="val">₹{((stats.disbTotal || 0) / 10000000).toFixed(1)} Cr</div><div className="lbl">Funds Disbursed</div></div>
        </div>
        <div className="sg-grid2">
          <div className="sg-card">
            <div className="sg-card-title">📊 Scheme-wise Progress</div>
            {stats.schemes?.length ? stats.schemes.map(s => {
              const enr = mis.find(m => m.code === s.code);
              return (
                <div key={s.id} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, marginBottom: 3 }}>
                    <span style={{ fontWeight: 600 }}>{s.name}</span>
                    <span style={{ color: '#6B7FA3' }}>{enr ? `${enr.certified}/${enr.enrolled} certified` : 'No data yet'}</span>
                  </div>
                  <div className="sg-prog-bar"><div className="sg-prog-fill" style={{ width: `${enr?.certRate || 0}%`, background: '#003087' }} /></div>
                </div>
              );
            }) : (
              <div className="sg-empty"><div className="icon">📋</div><div>Schemes data loading...</div></div>
            )}
            <button className="sg-btn sg-btn-teal sg-btn-sm" style={{ marginTop: 12, width: '100%' }} onClick={() => navigate('mis-scheme')}>View Full MIS →</button>
          </div>
          <div className="sg-card">
            <div className="sg-card-title">⚡ Quick Actions</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                ['🏫 Approve TP Onboarding', 'sg-btn-primary', () => navigate('tp-list')],
                ['💰 Process Disbursement', 'sg-btn-orange', () => { navigate('financial'); setTimeout(() => setModal('add-disb'), 300); }],
                ['📜 Generate MIS Report', 'sg-btn-teal', () => navigate('mis-scheme')],
                ['👤 Enrol Beneficiary', 'sg-btn-outline', () => { navigate('candidate-list'); setTimeout(() => setModal('add-candidate'), 300); }],
                ['🤝 View Grievances', 'sg-btn-outline', () => navigate('grievances')],
                ['🔍 Verify Certificate', 'sg-btn-outline', () => navigate('cert-verify')],
              ].map(([label, cls, fn]) => (
                <button key={label} className={`sg-btn ${cls}`} style={{ textAlign: 'left' }} onClick={fn}>{label}</button>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  };

  const renderTPs = () => (
    <>
      <div className="sg-ph"><h1>Training Partners</h1><p>All registered TPs under {user?.org_name || 'State'}</p></div>
      <div className="sg-kpi-grid">
        <div className="sg-kpi" style={{ '--c': '#003087' }}><div className="val">{stats?.tpCount || 0}</div><div className="lbl">Total TPs</div></div>
        <div className="sg-kpi" style={{ '--c': '#007B5E' }}><div className="val">{stats?.tpActive || 0}</div><div className="lbl">Verified</div></div>
        <div className="sg-kpi" style={{ '--c': '#FF6B00' }}><div className="val">{stats?.tpPending || 0}</div><div className="lbl">Pending</div></div>
      </div>
      <div className="sg-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div className="sg-card-title" style={{ margin: 0 }}>Training Partner Registry</div>
          <button className="sg-btn sg-btn-primary sg-btn-sm" onClick={() => setModal('add-tp')}>+ Add TP</button>
        </div>
        {loading ? <Skeleton /> : tps.length === 0 ? (
          <div className="sg-empty"><div className="icon">🏫</div><div>No training partners yet. Add your first TP.</div></div>
        ) : (
          <table>
            <thead><tr><th>Name</th><th>Type</th><th>District</th><th>Scheme</th><th>Accreditation</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {tps.map(tp => (
                <tr key={tp.id}>
                  <td style={{ fontWeight: 600 }}>{tp.name}</td>
                  <td style={{ fontSize: '10.5px' }}>{tp.type || '—'}</td>
                  <td>{tp.district || '—'}</td>
                  <td>{tp.scheme ? <span className="pill blue" style={{ fontSize: 9 }}>{tp.scheme}</span> : '—'}</td>
                  <td style={{ fontSize: '10.5px' }}>{tp.accreditation || '—'}</td>
                  <td>{pill(tp.status, { verified: 'green', pending: 'amber', suspended: 'red', blacklisted: 'red' })}</td>
                  <td style={{ display: 'flex', gap: 4 }}>
                    {tp.status === 'pending' && (
                      <button className="sg-btn sg-btn-teal sg-btn-sm" onClick={async () => {
                        await api.sgUpdateTP(tp.id, { status: 'verified' });
                        showToast('TP approved'); loadTPs(); loadStats();
                      }}>Approve</button>
                    )}
                    <button className="sg-btn sg-btn-outline sg-btn-sm" onClick={() => { setForm(tp); setModal('edit-tp'); }}>Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );

  const renderCandidates = () => (
    <>
      <div className="sg-ph"><h1>Beneficiary Registry</h1><p>All enrolled candidates across schemes and districts</p></div>
      <div className="sg-kpi-grid">
        <div className="sg-kpi" style={{ '--c': '#003087' }}><div className="val">{stats?.candTotal || 0}</div><div className="lbl">Total Beneficiaries</div></div>
        <div className="sg-kpi" style={{ '--c': '#007B5E' }}><div className="val">{stats?.candCertified || 0}</div><div className="lbl">Certified</div></div>
        <div className="sg-kpi" style={{ '--c': '#FF6B00' }}><div className="val">{stats?.candPlaced || 0}</div><div className="lbl">Placed</div></div>
        <div className="sg-kpi" style={{ '--c': '#DC2626' }}><div className="val">{stats?.candDropped || 0}</div><div className="lbl">Dropouts</div></div>
      </div>
      <div className="sg-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div className="sg-card-title" style={{ margin: 0 }}>Candidate Registry</div>
          <button className="sg-btn sg-btn-primary sg-btn-sm" onClick={() => { setForm({}); setModal('add-candidate'); }}>+ Enrol</button>
        </div>
        {loading ? <Skeleton /> : candidates.length === 0 ? (
          <div className="sg-empty"><div className="icon">👤</div><div>No candidates enrolled yet. Click Enrol to add one.</div></div>
        ) : (
          <table>
            <thead><tr><th>ID</th><th>Name</th><th>District</th><th>Scheme</th><th>Course</th><th>Status</th><th>Placed</th><th>Action</th></tr></thead>
            <tbody>
              {candidates.map(c => (
                <tr key={c.id}>
                  <td style={{ fontSize: '10.5px', color: '#6B7FA3' }}>{c.candidate_ref}</td>
                  <td style={{ fontWeight: 600 }}>{c.name}</td>
                  <td>{c.district || '—'}</td>
                  <td>{c.scheme ? <span className="pill blue" style={{ fontSize: 9 }}>{c.scheme}</span> : '—'}</td>
                  <td style={{ fontSize: '11px' }}>{c.course || '—'}</td>
                  <td>{pill(c.status, { enrolled: 'blue', 'in-training': 'blue', assessed: 'amber', certified: 'green', placed: 'green', dropped: 'red' })}</td>
                  <td><span className={`pill ${c.placement_status === 'placed' ? 'green' : 'gray'}`}>{c.placement_status === 'placed' ? 'Yes' : 'No'}</span></td>
                  <td>
                    <button className="sg-btn sg-btn-outline sg-btn-sm" onClick={() => { setForm(c); setModal('update-candidate'); }}>Update</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );

  const renderGrievances = () => (
    <>
      <div className="sg-ph"><h1>Grievance Redressal</h1><p>State Grievance Management System</p></div>
      <div className="sg-kpi-grid">
        <div className="sg-kpi" style={{ '--c': '#DC2626' }}><div className="val">{grievances.filter(g => g.priority === 'urgent').length}</div><div className="lbl">Urgent</div></div>
        <div className="sg-kpi" style={{ '--c': '#FF6B00' }}><div className="val">{grievances.filter(g => g.status === 'open').length}</div><div className="lbl">Open</div></div>
        <div className="sg-kpi" style={{ '--c': '#007B5E' }}><div className="val">{grievances.filter(g => g.status === 'resolved').length}</div><div className="lbl">Resolved</div></div>
        <div className="sg-kpi" style={{ '--c': '#003087' }}><div className="val">{grievances.length}</div><div className="lbl">Total</div></div>
      </div>
      <div className="sg-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div className="sg-card-title" style={{ margin: 0 }}>Grievance Tickets</div>
          <button className="sg-btn sg-btn-primary sg-btn-sm" onClick={() => { setForm({}); setModal('add-grievance'); }}>+ New Ticket</button>
        </div>
        {loading ? <Skeleton /> : grievances.length === 0 ? (
          <div className="sg-empty"><div className="icon">🤝</div><div>No grievances logged yet.</div></div>
        ) : (
          <table>
            <thead><tr><th>Ticket No.</th><th>Filed By</th><th>Category</th><th>District</th><th>Priority</th><th>Status</th><th>Days Open</th><th>Action</th></tr></thead>
            <tbody>
              {grievances.map(g => {
                const days = Math.floor((Date.now() - new Date(g.created_at).getTime()) / 86400000);
                return (
                  <tr key={g.id}>
                    <td style={{ fontWeight: 700, color: '#003087', fontSize: '10.5px' }}>{g.ticket_no}</td>
                    <td style={{ fontSize: '11px' }}>{g.filed_by || '—'}</td>
                    <td><span className="pill blue" style={{ fontSize: 9 }}>{g.category || '—'}</span></td>
                    <td>{g.district || '—'}</td>
                    <td>{pill(g.priority, { urgent: 'red', high: 'red', medium: 'amber', low: 'gray' })}</td>
                    <td>{pill(g.status, { open: 'red', 'in-progress': 'amber', resolved: 'green', closed: 'gray' })}</td>
                    <td style={{ fontWeight: 700, color: days > 30 ? '#DC2626' : days > 14 ? '#FF6B00' : '#6B7FA3' }}>{days}d</td>
                    <td>
                      {g.status === 'open' && (
                        <button className="sg-btn sg-btn-teal sg-btn-sm" onClick={async () => {
                          await api.sgUpdateGrievance(g.id, { status: 'resolved', resolution: 'Resolved by state officer' });
                          showToast('Grievance resolved'); loadGrievances(); loadStats();
                        }}>Resolve</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );

  const renderFinancial = () => (
    <>
      <div className="sg-ph"><h1>Financial Management</h1><p>Funds allocation, disbursement and financial tracking</p></div>
      <div className="sg-kpi-grid">
        <div className="sg-kpi" style={{ '--c': '#007B5E' }}><div className="val">₹{((stats?.disbTotal || 0) / 10000000).toFixed(1)} Cr</div><div className="lbl">Total Disbursed</div></div>
        <div className="sg-kpi" style={{ '--c': '#FF6B00' }}><div className="val">₹{((stats?.disbPending || 0) / 10000000).toFixed(1)} Cr</div><div className="lbl">Pending</div></div>
        <div className="sg-kpi" style={{ '--c': '#003087' }}><div className="val">{disbursements.length}</div><div className="lbl">Total Transactions</div></div>
      </div>
      <div className="sg-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div className="sg-card-title" style={{ margin: 0 }}>Disbursement Records</div>
          <button className="sg-btn sg-btn-orange sg-btn-sm" onClick={() => { setForm({}); setModal('add-disb'); }}>💰 Initiate Disbursement</button>
        </div>
        {loading ? <Skeleton /> : disbursements.length === 0 ? (
          <div className="sg-empty"><div className="icon">💰</div><div>No disbursements recorded yet.</div></div>
        ) : (
          <table>
            <thead><tr><th>Date</th><th>Training Partner</th><th>Scheme</th><th>Amount</th><th>Tranche</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {disbursements.map(d => (
                <tr key={d.id}>
                  <td style={{ fontSize: '10.5px' }}>{d.disbursed_date || d.created_at?.split('T')[0]}</td>
                  <td style={{ fontWeight: 600, fontSize: 11 }}>{d.tp_name || '—'}</td>
                  <td><span className="pill blue" style={{ fontSize: 9 }}>{d.scheme || '—'}</span></td>
                  <td style={{ fontWeight: 700, color: '#007B5E' }}>₹{Number(d.amount).toLocaleString()}</td>
                  <td style={{ fontSize: '10.5px' }}>{d.tranche || '—'}</td>
                  <td>{pill(d.status, { disbursed: 'green', pending: 'amber', processing: 'blue', 'on-hold': 'red' })}</td>
                  <td>
                    {d.status === 'pending' && (
                      <button className="sg-btn sg-btn-teal sg-btn-sm" onClick={async () => {
                        await api.sgUpdateDisbStatus(d.id, 'disbursed');
                        showToast('Marked as disbursed'); loadDisbursements(); loadStats();
                      }}>Mark Disbursed</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );

  const renderMis = () => (
    <>
      <div className="sg-ph"><h1>Scheme-wise MIS Report</h1><p>State-level scheme performance across all programs</p></div>
      {loading ? <Skeleton /> : mis.length === 0 ? (
        <div className="sg-card"><div className="sg-empty"><div className="icon">📊</div><div>No MIS data yet. Enrol beneficiaries to see scheme-wise reporting.</div></div></div>
      ) : (
        <div className="sg-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div className="sg-card-title" style={{ margin: 0 }}>Scheme-wise Performance</div>
            <button className="sg-btn sg-btn-teal sg-btn-sm" onClick={() => {
              const hdr = 'Scheme,Enrolled,Certified,Cert Rate,Placed,Disbursed\n';
              const body = mis.map(s => `${s.name},${s.enrolled},${s.certified},${s.certRate}%,${s.placed},${(s.disbursed/10000000).toFixed(2)}Cr`).join('\n');
              const url = URL.createObjectURL(new Blob([hdr+body],{type:'text/csv'}));
              Object.assign(document.createElement('a'),{href:url,download:'scheme-mis.csv'}).click();
              URL.revokeObjectURL(url);
            }}>📥 Export CSV</button>
          </div>
          <table>
            <thead><tr><th>Scheme</th><th>Enrolled</th><th>Certified</th><th>Cert Rate</th><th>Placed</th><th>Placement Rate</th><th>Disbursed</th></tr></thead>
            <tbody>
              {mis.map(s => (
                <tr key={s.id}>
                  <td style={{ fontWeight: 700 }}>{s.name}</td>
                  <td>{s.enrolled.toLocaleString()}</td>
                  <td>{s.certified.toLocaleString()}</td>
                  <td><span className={`pill ${s.certRate >= 75 ? 'green' : s.certRate >= 50 ? 'amber' : 'red'}`}>{s.certRate}%</span></td>
                  <td>{s.placed.toLocaleString()}</td>
                  <td><span className={`pill ${s.enrolled && (s.placed / s.enrolled * 100) >= 60 ? 'green' : 'amber'}`}>{s.enrolled ? Math.round(s.placed / s.enrolled * 100) : 0}%</span></td>
                  <td>₹{(s.disbursed / 10000000).toFixed(2)} Cr</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );

  const renderNotifications = () => (
    <>
      <div className="sg-ph"><h1>Notifications</h1><p>System alerts, approvals and platform activity</p></div>
      <div className="sg-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div className="sg-card-title" style={{ margin: 0 }}>All Notifications</div>
          {notifications.length > 0 && (
            <button className="sg-btn sg-btn-outline sg-btn-sm" onClick={async () => { await api.sgMarkNotifRead(); loadNotifications(); loadStats(); }}>✓ Mark All Read</button>
          )}
        </div>
        {loading ? <Skeleton /> : notifications.length === 0 ? (
          <div className="sg-empty"><div className="icon">🔔</div><div>No notifications yet.</div></div>
        ) : notifications.map(n => (
          <div key={n.id} style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: '1px solid #F1F5F9', alignItems: 'flex-start' }}>
            <div style={{ fontSize: 18 }}>{n.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: n.is_read ? '#6B7FA3' : '#1A2B4A' }}>{n.title}</div>
              <div style={{ fontSize: 11.5, color: '#3D5170', marginTop: 2 }}>{n.message}</div>
              <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 3 }}>{n.created_at?.split('T')[0]}</div>
            </div>
            {!n.is_read && <div style={{ width: 8, height: 8, background: '#FF6B00', borderRadius: '50%', marginTop: 6, flexShrink: 0 }} />}
          </div>
        ))}
      </div>
    </>
  );

  const renderCertVerify = () => {
    const verify = async () => {
      setCertErr(''); setCertResult(null);
      try { const c = await api.sgVerifyCert(certNo); setCertResult(c); }
      catch { setCertErr('Certificate not found in the system.'); }
    };
    return (
      <>
        <div className="sg-ph"><h1>Certificate Verification</h1><p>Verify candidate certificates issued under Skill India Digital</p></div>
        <div className="sg-card" style={{ maxWidth: 480 }}>
          <div className="sg-card-title">🔍 Verify a Certificate</div>
          <div className="sg-form-group" style={{ marginBottom: 12 }}>
            <label>Certificate Number</label>
            <input value={certNo} onChange={e => setCertNo(e.target.value)} placeholder="e.g. CERT-TG-2024-001821" onKeyDown={e => e.key === 'Enter' && verify()} />
          </div>
          <button className="sg-btn sg-btn-primary" style={{ width: '100%', padding: 10 }} onClick={verify}>🔍 Verify Certificate</button>
        </div>
        {certErr && <div className="sg-alert red">❌ {certErr}</div>}
        {certResult && (
          <div className="sg-alert green">
            ✅ <strong>{certResult.cert_no}</strong> — {certResult.candidate_name} · {certResult.course} · Issued {certResult.issued_date} · <span className={`pill ${certResult.valid_status === 'valid' ? 'green' : 'red'}`}>{certResult.valid_status.toUpperCase()}</span>
          </div>
        )}
      </>
    );
  };

  const renderSettings = () => <AccountPreferences onLogout={() => { logout(); window.location.href = '/'; }} />;

  // ── 1. LIVE ANALYTICS ──
  const renderLiveAnalytics = () => {
    const placed = stats?.candPlaced || 0;
    const certified = stats?.candCertified || 0;
    const total = stats?.candTotal || 1;
    const certPct = Math.round(certified / total * 100);
    const placePct = Math.round(placed / (certified || 1) * 100);
    const bars = [
      { label: 'Certification Rate', val: certPct, color: '#003087' },
      { label: 'Placement Rate', val: placePct, color: '#FF6B00' },
      { label: 'TP Active %', val: stats?.tpCount ? Math.round(stats.tpActive / stats.tpCount * 100) : 0, color: '#007B5E' },
      { label: 'Grievance Resolution', val: grievances.length ? Math.round(grievances.filter(g => g.status === 'resolved').length / grievances.length * 100) : 0, color: '#7C3AED' },
    ];
    const distMap = {};
    candidates.forEach(c => {
      const d = c.district || 'Unknown';
      if (!distMap[d]) distMap[d] = { d, enrolled: 0, certified: 0, placed: 0 };
      distMap[d].enrolled++;
      if (c.certification_status === 'certified') distMap[d].certified++;
      if (c.placement_status === 'placed') distMap[d].placed++;
    });
    const district = Object.values(distMap).sort((a, b) => b.enrolled - a.enrolled).slice(0, 8);
    return (
      <>
        <div className="sg-ph"><h1>Live Analytics</h1><p>Real-time skill development metrics for {user?.org_name || 'Telangana'}</p></div>
        <div className="sg-kpi-grid">
          {[
            ['Total Beneficiaries', total - 1, '#003087'],
            ['Certified', certified, '#007B5E'],
            ['Placed', placed, '#FF6B00'],
            ['Active TPs', stats?.tpActive || 0, '#7C3AED'],
            ['Open Grievances', stats?.grievOpen || 0, '#DC2626'],
            ['Funds (Cr)', `₹${((stats?.disbTotal || 0) / 10000000).toFixed(1)}`, '#0891B2'],
          ].map(([lbl, val, c]) => (
            <div className="sg-kpi" key={lbl} style={{ '--c': c }}><div className="val">{val}</div><div className="lbl">{lbl}</div></div>
          ))}
        </div>
        <div className="sg-grid2">
          <div className="sg-card">
            <div className="sg-card-title">📊 Key Performance Indicators</div>
            {bars.map(b => (
              <div key={b.label} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span style={{ fontWeight: 600 }}>{b.label}</span>
                  <span style={{ color: b.color, fontWeight: 700 }}>{b.val}%</span>
                </div>
                <div className="sg-prog-bar"><div className="sg-prog-fill" style={{ width: `${b.val}%`, background: b.color }} /></div>
              </div>
            ))}
          </div>
          <div className="sg-card">
            <div className="sg-card-title">🗺️ District-wise Beneficiaries</div>
            <table>
              <thead><tr><th>District</th><th>Enrolled</th><th>Certified</th><th>Placed</th><th>Rate</th></tr></thead>
              <tbody>
                {district.map(d => (
                  <tr key={d.d}>
                    <td style={{ fontWeight: 600 }}>{d.d}</td>
                    <td>{d.enrolled}</td>
                    <td>{d.certified}</td>
                    <td>{d.placed}</td>
                    <td><span className={`pill ${d.enrolled && d.placed / d.enrolled >= 0.5 ? 'green' : 'amber'}`}>{d.enrolled ? Math.round(d.placed / d.enrolled * 100) : 0}%</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="sg-card">
          <div className="sg-card-title">📈 Scheme Comparison</div>
          <table>
            <thead><tr><th>Scheme</th><th>Enrolled</th><th>Certified</th><th>Placed</th><th>Cert %</th><th>Placement %</th></tr></thead>
            <tbody>
              {[
                { s: 'PMKVY', e: 5, c: 4, p: 3 },
                { s: 'DDU-GKY', e: 3, c: 1, p: 1 },
                { s: 'STATE', e: 2, c: 1, p: 1 },
              ].map(r => (
                <tr key={r.s}>
                  <td style={{ fontWeight: 700 }}><span className="pill blue">{r.s}</span></td>
                  <td>{r.e}</td><td>{r.c}</td><td>{r.p}</td>
                  <td><span className={`pill ${r.c / r.e >= 0.7 ? 'green' : 'amber'}`}>{Math.round(r.c / r.e * 100)}%</span></td>
                  <td><span className={`pill ${r.p / r.c >= 0.7 ? 'green' : 'amber'}`}>{r.c ? Math.round(r.p / r.c * 100) : 0}%</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  };

  // ── 2. SCHEME DETAIL ──
  const renderSchemeDetail = (code, name, icon, ministry, desc) => {
    const schemeCands = candidates.filter(c => c.scheme === code);
    const schemeTPs = tps.filter(t => t.scheme === code);
    const certified = schemeCands.filter(c => c.certification_status === 'certified').length;
    const placed = schemeCands.filter(c => c.placement_status === 'placed').length;
    const disbAmt = disbursements.filter(d => d.scheme === code).reduce((s, d) => s + Number(d.amount || 0), 0);
    return (
      <>
        <div className="sg-ph">
          <h1>{icon} {name}</h1>
          <p>{ministry} · {desc}</p>
        </div>
        <div className="sg-kpi-grid">
          <div className="sg-kpi" style={{ '--c': '#003087' }}><div className="val">{schemeCands.length}</div><div className="lbl">Enrolled</div></div>
          <div className="sg-kpi" style={{ '--c': '#007B5E' }}><div className="val">{certified}</div><div className="lbl">Certified</div><div className="delta">{schemeCands.length ? Math.round(certified / schemeCands.length * 100) : 0}% rate</div></div>
          <div className="sg-kpi" style={{ '--c': '#FF6B00' }}><div className="val">{placed}</div><div className="lbl">Placed</div></div>
          <div className="sg-kpi" style={{ '--c': '#7C3AED' }}><div className="val">{schemeTPs.length}</div><div className="lbl">Training Partners</div></div>
          <div className="sg-kpi" style={{ '--c': '#DC2626' }}><div className="val">₹{(disbAmt / 100000).toFixed(1)} L</div><div className="lbl">Disbursed</div></div>
        </div>
        <div className="sg-grid2">
          <div className="sg-card">
            <div className="sg-card-title">🏫 Training Partners under {code}</div>
            {schemeTPs.length === 0
              ? <div className="sg-empty"><div className="icon">🏫</div><div>No TPs assigned to this scheme yet.</div></div>
              : <table>
                  <thead><tr><th>Name</th><th>District</th><th>Status</th></tr></thead>
                  <tbody>{schemeTPs.map(t => <tr key={t.id}><td style={{ fontWeight: 600 }}>{t.name}</td><td>{t.district}</td><td>{pill(t.status, { verified: 'green', pending: 'amber' })}</td></tr>)}</tbody>
                </table>
            }
          </div>
          <div className="sg-card">
            <div className="sg-card-title">👤 Beneficiaries under {code}</div>
            {schemeCands.length === 0
              ? <div className="sg-empty"><div className="icon">👤</div><div>No beneficiaries enrolled under this scheme.</div></div>
              : <table>
                  <thead><tr><th>Name</th><th>District</th><th>Status</th></tr></thead>
                  <tbody>{schemeCands.slice(0, 8).map(c => <tr key={c.id}><td style={{ fontWeight: 600 }}>{c.name}</td><td>{c.district}</td><td>{pill(c.status, { placed: 'green', certified: 'blue', enrolled: 'gray', 'in-training': 'blue', assessed: 'amber', dropped: 'red' })}</td></tr>)}</tbody>
                </table>
            }
          </div>
        </div>
      </>
    );
  };

  // ── 3. TARGETS ──
  const renderTargets = () => {
    return (
      <>
        <div className="sg-ph"><h1>Targets & Allocation</h1><p>Scheme-wise annual targets and quarterly achievement tracking</p></div>
        <div className="sg-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div className="sg-card-title" style={{ margin: 0 }}>FY 2024-25 Targets</div>
            <button className="sg-btn sg-btn-primary sg-btn-sm" onClick={() => { setForm({}); setModal('add-target'); }}>+ Set Target</button>
          </div>
          {targets.length === 0
            ? <div className="sg-empty"><div className="icon">🎯</div><div>No targets set yet.</div></div>
            : <table>
                <thead><tr><th>Scheme</th><th>Annual Target</th><th>Q1 Target</th><th>Q1 Achieved</th><th>Q2 Target</th><th>Q2 Achieved</th><th>Q3</th><th>Q4</th><th>Overall %</th></tr></thead>
                <tbody>
                  {targets.map(t => {
                    const totalTarget = t.q1_target + t.q2_target + t.q3_target + t.q4_target;
                    const totalAchieved = t.q1_achieved + t.q2_achieved + t.q3_achieved + t.q4_achieved;
                    const pct = totalTarget ? Math.round(totalAchieved / totalTarget * 100) : 0;
                    return (
                      <tr key={t.id}>
                        <td style={{ fontWeight: 700 }}><span className="pill blue">{t.scheme_code || t.scheme_id}</span></td>
                        <td style={{ fontWeight: 700 }}>{t.annual_target?.toLocaleString()}</td>
                        <td>{t.q1_target}</td>
                        <td><span className={`pill ${t.q1_achieved >= t.q1_target ? 'green' : 'amber'}`}>{t.q1_achieved}</span></td>
                        <td>{t.q2_target}</td>
                        <td><span className={`pill ${t.q2_achieved >= t.q2_target ? 'green' : 'amber'}`}>{t.q2_achieved}</span></td>
                        <td style={{ color: '#94A3B8' }}>{t.q3_target}</td>
                        <td style={{ color: '#94A3B8' }}>{t.q4_target}</td>
                        <td>
                          <span className={`pill ${pct >= 100 ? 'green' : pct >= 70 ? 'amber' : 'red'}`}>{pct}%</span>
                          <div className="sg-prog-bar" style={{ marginTop: 4 }}><div className="sg-prog-fill" style={{ width: `${Math.min(pct, 100)}%`, background: pct >= 100 ? '#22C55E' : pct >= 70 ? '#FF6B00' : '#EF4444' }} /></div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
          }
        </div>
      </>
    );
  };

  // ── 4. TP ONBOARDING ──
  const renderTPOnboard = () => {
    const pending = tps.filter(t => t.status === 'pending');
    return (
      <>
        <div className="sg-ph"><h1>TP Onboarding & Approval</h1><p>Review and approve new training partner applications</p></div>
        {pending.length > 0 && <div className="sg-alert amber">⚠️ {pending.length} application(s) awaiting your approval.</div>}
        <div className="sg-card">
          <div className="sg-card-title">📋 Pending Onboarding Applications</div>
          {pending.length === 0
            ? <div className="sg-empty"><div className="icon">✅</div><div>No pending applications. All TPs reviewed.</div></div>
            : <table>
                <thead><tr><th>Name</th><th>Type</th><th>District</th><th>Scheme</th><th>NSDC Code</th><th>Email</th><th>Actions</th></tr></thead>
                <tbody>
                  {pending.map(tp => (
                    <tr key={tp.id}>
                      <td style={{ fontWeight: 700 }}>{tp.name}</td>
                      <td>{tp.type}</td><td>{tp.district}</td>
                      <td><span className="pill blue" style={{ fontSize: 9 }}>{tp.scheme}</span></td>
                      <td style={{ fontSize: '10.5px', color: '#6B7FA3' }}>{tp.nsdc_code || '—'}</td>
                      <td style={{ fontSize: '11px' }}>{tp.email}</td>
                      <td style={{ display: 'flex', gap: 4 }}>
                        <button className="sg-btn sg-btn-teal sg-btn-sm" onClick={async () => { await api.sgUpdateTP(tp.id, { status: 'verified' }); showToast('TP Approved'); loadTPs(); loadStats(); }}>✓ Approve</button>
                        <button className="sg-btn sg-btn-danger sg-btn-sm" onClick={async () => { await api.sgUpdateTP(tp.id, { status: 'suspended' }); showToast('TP Rejected', 'red'); loadTPs(); loadStats(); }}>✗ Reject</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
          }
        </div>
        <div className="sg-card">
          <div className="sg-card-title">✅ Approved Training Partners ({tps.filter(t => t.status === 'verified').length})</div>
          <table>
            <thead><tr><th>Name</th><th>District</th><th>Scheme</th><th>Accreditation</th><th>Expiry</th><th>Centres</th></tr></thead>
            <tbody>
              {tps.filter(t => t.status === 'verified').map(tp => (
                <tr key={tp.id}>
                  <td style={{ fontWeight: 600 }}>{tp.name}</td>
                  <td>{tp.district}</td>
                  <td><span className="pill blue" style={{ fontSize: 9 }}>{tp.scheme}</span></td>
                  <td>{tp.accreditation || '—'}</td>
                  <td style={{ fontSize: '10.5px' }}>{tp.accreditation_expiry || '—'}</td>
                  <td>{tp.centre_count || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  };

  // ── 5. ACCREDITATION & VERIFY ──
  const renderTPVerify = () => (
    <>
      <div className="sg-ph"><h1>Accreditation & Verification</h1><p>Manage TP accreditation status and renewal tracking</p></div>
      <div className="sg-kpi-grid">
        {[
          ['NSDC Accredited', tps.filter(t => t.accreditation === 'NSDC').length, '#003087'],
          ['AICTE Accredited', tps.filter(t => t.accreditation === 'AICTE').length, '#7C3AED'],
          ['ISO Certified', tps.filter(t => t.accreditation?.includes('ISO')).length, '#007B5E'],
          ['Expiring Soon', tps.filter(t => t.accreditation_expiry && new Date(t.accreditation_expiry) < new Date(Date.now() + 90 * 86400000)).length, '#DC2626'],
        ].map(([l, v, c]) => <div key={l} className="sg-kpi" style={{ '--c': c }}><div className="val">{v}</div><div className="lbl">{l}</div></div>)}
      </div>
      <div className="sg-card">
        <div className="sg-card-title">📋 Accreditation Registry</div>
        {tps.length === 0
          ? <div className="sg-empty"><div className="icon">📋</div><div>No training partners registered yet.</div></div>
          : <table>
              <thead><tr><th>Name</th><th>Accreditation</th><th>Expiry</th><th>Status</th><th>Alert</th></tr></thead>
              <tbody>
                {tps.map(tp => {
                  const expiry = tp.accreditation_expiry ? new Date(tp.accreditation_expiry) : null;
                  const daysLeft = expiry ? Math.floor((expiry - Date.now()) / 86400000) : null;
                  return (
                    <tr key={tp.id}>
                      <td style={{ fontWeight: 600 }}>{tp.name}</td>
                      <td><span className="pill purple">{tp.accreditation || 'Not Set'}</span></td>
                      <td style={{ fontSize: '10.5px' }}>{tp.accreditation_expiry || '—'}</td>
                      <td>{pill(tp.status, { verified: 'green', pending: 'amber', suspended: 'red' })}</td>
                      <td>{daysLeft !== null ? <span className={`pill ${daysLeft < 30 ? 'red' : daysLeft < 90 ? 'amber' : 'green'}`}>{daysLeft < 0 ? 'Expired' : `${daysLeft}d left`}</span> : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
        }
      </div>
    </>
  );

  // ── 6. ENROLMENT ──
  const renderEnrolment = () => {
    const byMonth = {};
    candidates.forEach(c => {
      const m = (c.enroll_date || c.created_at || '').slice(0, 7);
      if (m) byMonth[m] = (byMonth[m] || 0) + 1;
    });
    const months = Object.entries(byMonth).sort(([a], [b]) => a.localeCompare(b));
    return (
      <>
        <div className="sg-ph"><h1>Enrolment Records</h1><p>Beneficiary enrolment trend and batch-wise breakdown</p></div>
        <div className="sg-kpi-grid">
          {[
            ['Total Enrolled', candidates.length, '#003087'],
            ['Male', candidates.filter(c => c.gender === 'M').length, '#0891B2'],
            ['Female', candidates.filter(c => c.gender === 'F').length, '#7C3AED'],
            ['In Training', candidates.filter(c => c.status === 'in-training').length, '#FF6B00'],
          ].map(([l, v, c]) => <div key={l} className="sg-kpi" style={{ '--c': c }}><div className="val">{v}</div><div className="lbl">{l}</div></div>)}
        </div>
        <div className="sg-grid2">
          <div className="sg-card">
            <div className="sg-card-title">📅 Month-wise Enrolment</div>
            {months.length === 0
              ? <div className="sg-empty"><div className="icon">📅</div><div>No enrolment data yet.</div></div>
              : months.map(([m, cnt]) => (
                <div key={m} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 11, color: '#6B7FA3', width: 60, flexShrink: 0 }}>{m}</span>
                  <div style={{ flex: 1, height: 20, background: '#F1F5F9', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: '#003087', width: `${(cnt / (Math.max(...months.map(([, n]) => n)) || 1)) * 100}%`, display: 'flex', alignItems: 'center', paddingLeft: 6 }}>
                      <span style={{ fontSize: 10, color: '#fff', fontWeight: 700 }}>{cnt}</span>
                    </div>
                  </div>
                </div>
              ))
            }
          </div>
          <div className="sg-card">
            <div className="sg-card-title">📊 Scheme-wise Enrolment</div>
            {['PMKVY', 'DDU-GKY', 'STATE', 'NAPS', 'CSR'].map(s => {
              const cnt = candidates.filter(c => c.scheme === s).length;
              return cnt > 0 ? (
                <div key={s} className="sg-stat-row">
                  <span className="lbl"><span className="pill blue" style={{ fontSize: 9 }}>{s}</span></span>
                  <span className="val">{cnt} beneficiaries</span>
                </div>
              ) : null;
            })}
          </div>
        </div>
        <div className="sg-card">
          <div className="sg-card-title">📋 Batch-wise Enrolment</div>
          <table>
            <thead><tr><th>Batch Code</th><th>Course</th><th>Scheme</th><th>TP</th><th>Enrol Date</th><th>Count</th><th>Status Distribution</th></tr></thead>
            <tbody>
              {Object.entries(
                candidates.reduce((acc, c) => { const k = c.batch_code || 'No Batch'; if (!acc[k]) acc[k] = { code: k, course: c.course, scheme: c.scheme, date: c.enroll_date, items: [] }; acc[k].items.push(c); return acc; }, {})
              ).map(([k, b]) => (
                <tr key={k}>
                  <td style={{ fontWeight: 700, fontSize: '10.5px' }}>{b.code}</td>
                  <td style={{ fontSize: '11px' }}>{b.course}</td>
                  <td><span className="pill blue" style={{ fontSize: 9 }}>{b.scheme}</span></td>
                  <td style={{ fontSize: '10.5px' }}>{tps.find(t => t.id === b.items[0]?.tp_id)?.name?.split(' ').slice(0, 2).join(' ') || '—'}</td>
                  <td style={{ fontSize: '10.5px', color: '#6B7FA3' }}>{b.date}</td>
                  <td style={{ fontWeight: 700 }}>{b.items.length}</td>
                  <td style={{ fontSize: '10px' }}>{['placed', 'certified', 'in-training', 'enrolled', 'dropped'].filter(s => b.items.some(i => i.status === s)).map(s => <span key={s} className={`pill ${s === 'placed' ? 'green' : s === 'certified' ? 'blue' : s === 'dropped' ? 'red' : 'amber'}`} style={{ fontSize: 8, marginRight: 2 }}>{b.items.filter(i => i.status === s).length} {s}</span>)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  };

  // ── 7. PLACEMENTS ──
  const renderPlacements = () => {
    const placed = candidates.filter(c => c.placement_status === 'placed');
    const avgSal = placed.length ? Math.round(placed.reduce((s, c) => s + (c.salary || 0), 0) / placed.length) : 0;
    return (
      <>
        <div className="sg-ph"><h1>Placement Tracking</h1><p>Employer-wise placement outcomes and salary analysis</p></div>
        <div className="sg-kpi-grid">
          <div className="sg-kpi" style={{ '--c': '#007B5E' }}><div className="val">{placed.length}</div><div className="lbl">Total Placed</div></div>
          <div className="sg-kpi" style={{ '--c': '#003087' }}><div className="val">₹{avgSal.toLocaleString()}</div><div className="lbl">Avg Salary/month</div></div>
          <div className="sg-kpi" style={{ '--c': '#FF6B00' }}><div className="val">{[...new Set(placed.map(c => c.employer_name).filter(Boolean))].length}</div><div className="lbl">Unique Employers</div></div>
          <div className="sg-kpi" style={{ '--c': '#7C3AED' }}><div className="val">{candidates.filter(c => c.certification_status === 'certified' && c.placement_status !== 'placed').length}</div><div className="lbl">Certified, Unplaced</div></div>
        </div>
        <div className="sg-card">
          <div className="sg-card-title">💼 Placed Beneficiaries</div>
          {placed.length === 0
            ? <div className="sg-empty"><div className="icon">💼</div><div>No placements recorded yet.</div></div>
            : <table>
                <thead><tr><th>Name</th><th>Course</th><th>Scheme</th><th>Employer</th><th>Salary</th><th>District</th></tr></thead>
                <tbody>
                  {placed.map(c => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 700 }}>{c.name}</td>
                      <td style={{ fontSize: '11px' }}>{c.course}</td>
                      <td><span className="pill blue" style={{ fontSize: 9 }}>{c.scheme}</span></td>
                      <td style={{ fontWeight: 600, color: '#003087' }}>{c.employer_name || '—'}</td>
                      <td style={{ fontWeight: 700, color: '#007B5E' }}>₹{Number(c.salary || 0).toLocaleString()}/mo</td>
                      <td>{c.district}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
          }
        </div>
      </>
    );
  };

  // ── 8. DROPOUTS ──
  const renderDropouts = () => {
    const dropped = candidates.filter(c => c.status === 'dropped');
    return (
      <>
        <div className="sg-ph"><h1>Dropout Analysis</h1><p>Identify and analyse beneficiary dropout patterns</p></div>
        <div className="sg-kpi-grid">
          <div className="sg-kpi" style={{ '--c': '#DC2626' }}><div className="val">{dropped.length}</div><div className="lbl">Total Dropouts</div></div>
          <div className="sg-kpi" style={{ '--c': '#FF6B00' }}><div className="val">{candidates.length ? Math.round(dropped.length / candidates.length * 100) : 0}%</div><div className="lbl">Dropout Rate</div></div>
          <div className="sg-kpi" style={{ '--c': '#003087' }}><div className="val">{dropped.filter(c => c.gender === 'M').length}</div><div className="lbl">Male Dropouts</div></div>
          <div className="sg-kpi" style={{ '--c': '#7C3AED' }}><div className="val">{dropped.filter(c => c.gender === 'F').length}</div><div className="lbl">Female Dropouts</div></div>
        </div>
        <div className="sg-card">
          <div className="sg-card-title">⚠️ Dropout Registry</div>
          {dropped.length === 0
            ? <div className="sg-alert green">✅ No dropouts recorded. Excellent retention!</div>
            : <table>
                <thead><tr><th>Name</th><th>Gender</th><th>Scheme</th><th>Course</th><th>District</th><th>TP</th><th>Reason</th></tr></thead>
                <tbody>
                  {dropped.map(c => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 700 }}>{c.name}</td>
                      <td>{c.gender}</td>
                      <td><span className="pill blue" style={{ fontSize: 9 }}>{c.scheme}</span></td>
                      <td style={{ fontSize: '11px' }}>{c.course}</td>
                      <td>{c.district}</td>
                      <td style={{ fontSize: '10.5px' }}>{tps.find(t => t.id === c.tp_id)?.name?.split(' ').slice(0, 2).join(' ') || '—'}</td>
                      <td><span className="pill red" style={{ fontSize: 9 }}>{c.dropout_reason || 'Not specified'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
          }
        </div>
        <div className="sg-card">
          <div className="sg-card-title">📊 Dropout by Scheme</div>
          {['PMKVY', 'DDU-GKY', 'STATE', 'NAPS'].map(s => {
            const cnt = dropped.filter(c => c.scheme === s).length;
            const total = candidates.filter(c => c.scheme === s).length;
            if (!total) return null;
            const rate = Math.round(cnt / total * 100);
            return (
              <div key={s} className="sg-stat-row">
                <span className="lbl"><span className="pill blue" style={{ fontSize: 9 }}>{s}</span> — {cnt}/{total}</span>
                <span className="val"><span className={`pill ${rate > 20 ? 'red' : rate > 10 ? 'amber' : 'green'}`}>{rate}% dropout</span></span>
              </div>
            );
          })}
        </div>
      </>
    );
  };

  // ── 9. SECTORS ──
  const renderSectors = () => {
    const sectorMap = {};
    candidates.forEach(c => {
      const s = c.course?.split(' ').slice(-1)[0] || 'General';
      if (!sectorMap[s]) sectorMap[s] = { enrolled: 0, placed: 0 };
      sectorMap[s].enrolled++;
      if (c.placement_status === 'placed') sectorMap[s].placed++;
    });
    const sectors = Object.entries(sectorMap).sort(([, a], [, b]) => b.enrolled - a.enrolled);
    const staticSectors = [
      { name: 'Electronics & Hardware', demand: 'High', jobs: 1240, icon: '⚡' },
      { name: 'Healthcare', demand: 'Very High', jobs: 2100, icon: '🏥' },
      { name: 'Retail & Sales', demand: 'High', jobs: 980, icon: '🛍️' },
      { name: 'Construction & Infra', demand: 'Medium', jobs: 760, icon: '🏗️' },
      { name: 'Textiles & Apparel', demand: 'Medium', jobs: 540, icon: '👗' },
      { name: 'IT-ITeS', demand: 'Very High', jobs: 3200, icon: '💻' },
      { name: 'Agriculture & Allied', demand: 'Low', jobs: 320, icon: '🌾' },
      { name: 'Beauty & Wellness', demand: 'High', jobs: 670, icon: '💅' },
    ];
    return (
      <>
        <div className="sg-ph"><h1>Sector-wise Data</h1><p>Sector demand analysis and skill gap mapping for Telangana</p></div>
        <div className="sg-grid2">
          <div className="sg-card">
            <div className="sg-card-title">📊 Courses in Your State (from enrolments)</div>
            {sectors.length === 0
              ? <div className="sg-empty"><div className="icon">🏭</div><div>Enrol beneficiaries to see sector breakdown.</div></div>
              : sectors.map(([s, d]) => (
                <div key={s} className="sg-stat-row">
                  <span className="lbl">{s}</span>
                  <span style={{ display: 'flex', gap: 6 }}>
                    <span className="pill blue">{d.enrolled} enrolled</span>
                    <span className="pill green">{d.placed} placed</span>
                  </span>
                </div>
              ))
            }
          </div>
          <div className="sg-card">
            <div className="sg-card-title">📈 Telangana Sector Demand Index</div>
            {staticSectors.map(s => (
              <div key={s.name} className="sg-stat-row">
                <span className="lbl">{s.icon} {s.name}</span>
                <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span className={`pill ${s.demand === 'Very High' ? 'green' : s.demand === 'High' ? 'blue' : s.demand === 'Medium' ? 'amber' : 'gray'}`}>{s.demand}</span>
                  <span style={{ fontSize: 10, color: '#6B7FA3' }}>{s.jobs.toLocaleString()} openings</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </>
    );
  };

  // ── 10. EMPLOYERS ──
  const renderEmployers = () => {
    const empMap = {};
    candidates.filter(c => c.employer_name).forEach(c => {
      if (!empMap[c.employer_name]) empMap[c.employer_name] = { name: c.employer_name, count: 0, avgSal: 0, total: 0 };
      empMap[c.employer_name].count++;
      empMap[c.employer_name].total += c.salary || 0;
    });
    const employers = Object.values(empMap).map(e => ({ ...e, avgSal: Math.round(e.total / e.count) })).sort((a, b) => b.count - a.count);
    return (
      <>
        <div className="sg-ph"><h1>Employer Partners</h1><p>Companies that have hired Skill India beneficiaries from {user?.org_name || 'the state'}</p></div>
        <div className="sg-kpi-grid">
          <div className="sg-kpi" style={{ '--c': '#003087' }}><div className="val">{employers.length}</div><div className="lbl">Employer Partners</div></div>
          <div className="sg-kpi" style={{ '--c': '#007B5E' }}><div className="val">{candidates.filter(c => c.placement_status === 'placed').length}</div><div className="lbl">Total Placements</div></div>
          <div className="sg-kpi" style={{ '--c': '#FF6B00' }}><div className="val">₹{employers.length ? Math.round(employers.reduce((s, e) => s + e.avgSal, 0) / employers.length).toLocaleString() : 0}</div><div className="lbl">Avg Salary</div></div>
        </div>
        <div className="sg-card">
          <div className="sg-card-title">🏢 Employer Partnership Register</div>
          {employers.length === 0
            ? <div className="sg-empty"><div className="icon">🏢</div><div>No employer partnerships yet. Placements will appear here once candidates are placed.</div></div>
            : <table>
                <thead><tr><th>Employer</th><th>Candidates Hired</th><th>Avg Salary</th><th>Rating</th></tr></thead>
                <tbody>
                  {employers.map(e => (
                    <tr key={e.name}>
                      <td style={{ fontWeight: 700 }}>{e.name}</td>
                      <td><span className="pill blue">{e.count}</span></td>
                      <td style={{ fontWeight: 700, color: '#007B5E' }}>₹{e.avgSal.toLocaleString()}/mo</td>
                      <td><span className={`pill ${e.avgSal >= 18000 ? 'green' : e.avgSal >= 14000 ? 'blue' : 'amber'}`}>{e.avgSal >= 18000 ? '⭐ Premium' : e.avgSal >= 14000 ? 'Standard' : 'Entry'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
          }
        </div>
      </>
    );
  };

  // ── 11. MIS MONTHLY ──
  const renderMisMonthly = () => {
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const monthlyMap = {};
    candidates.forEach(c => {
      const d = c.enroll_date || c.created_at;
      if (!d) return;
      const dt = new Date(d);
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2,'0')}`;
      if (!monthlyMap[key]) monthlyMap[key] = { key, label: `${monthNames[dt.getMonth()]} ${dt.getFullYear()}`, enrolled: 0, certified: 0, placed: 0 };
      monthlyMap[key].enrolled++;
      if (c.certification_status === 'certified') monthlyMap[key].certified++;
      if (c.placement_status === 'placed') monthlyMap[key].placed++;
    });
    const rows = Object.values(monthlyMap).sort((a, b) => a.key.localeCompare(b.key));
    const exportCSV = () => {
      const hdr = 'Month,Enrolled,Certified,Placed,Cert Rate\n';
      const body = rows.map(r => `${r.label},${r.enrolled},${r.certified},${r.placed},${r.enrolled ? Math.round(r.certified/r.enrolled*100)+'%' : '0%'}`).join('\n');
      const url = URL.createObjectURL(new Blob([hdr + body], { type: 'text/csv' }));
      Object.assign(document.createElement('a'), { href: url, download: 'monthly-mis.csv' }).click();
      URL.revokeObjectURL(url);
    };
    return (
      <>
        <div className="sg-ph"><h1>Monthly MIS Report</h1><p>Month-wise progress derived from enrolment records</p></div>
        <div className="sg-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div className="sg-card-title" style={{ margin: 0 }}>Enrolment Month-wise Summary</div>
            <button className="sg-btn sg-btn-teal sg-btn-sm" onClick={exportCSV}>📥 Export CSV</button>
          </div>
          {rows.length === 0
            ? <div className="sg-empty"><div className="icon">📈</div><div>No enrolment records found. Enrol beneficiaries to see monthly trends.</div></div>
            : <table>
                <thead><tr><th>Month</th><th>Enrolled</th><th>Certified</th><th>Placed</th><th>Cert Rate</th></tr></thead>
                <tbody>
                  {rows.map(r => (
                    <tr key={r.key}>
                      <td style={{ fontWeight: 700 }}>{r.label}</td>
                      <td>{r.enrolled}</td>
                      <td>{r.certified}</td>
                      <td>{r.placed}</td>
                      <td>{r.enrolled ? <span className={`pill ${r.certified/r.enrolled >= 0.7 ? 'green' : 'amber'}`}>{Math.round(r.certified/r.enrolled*100)}%</span> : '—'}</td>
                    </tr>
                  ))}
                  <tr style={{ background: '#F8FAFC', fontWeight: 700 }}>
                    <td>Total</td>
                    <td>{rows.reduce((s,r) => s+r.enrolled,0)}</td>
                    <td>{rows.reduce((s,r) => s+r.certified,0)}</td>
                    <td>{rows.reduce((s,r) => s+r.placed,0)}</td>
                    <td>—</td>
                  </tr>
                </tbody>
              </table>
          }
        </div>
      </>
    );
  };

  // ── 12. MIS DISTRICT ──
  const renderMisDistrict = () => {
    const distMap = {};
    candidates.forEach(c => {
      const d = c.district || 'Unknown';
      if (!distMap[d]) distMap[d] = { enrolled: 0, certified: 0, placed: 0, dropped: 0 };
      distMap[d].enrolled++;
      if (c.certification_status === 'certified') distMap[d].certified++;
      if (c.placement_status === 'placed') distMap[d].placed++;
      if (c.status === 'dropped') distMap[d].dropped++;
    });
    const rows = Object.entries(distMap).sort(([, a], [, b]) => b.enrolled - a.enrolled);
    return (
      <>
        <div className="sg-ph"><h1>District-wise Report</h1><p>Performance breakdown across all districts in {user?.org_name || 'the state'}</p></div>
        <div className="sg-card">
          <div className="sg-card-title">🗺️ District Performance Matrix</div>
          {rows.length === 0
            ? <div className="sg-empty"><div className="icon">🗺️</div><div>No district data available yet. Enrol beneficiaries across districts.</div></div>
            : <table>
                <thead><tr><th>District</th><th>Enrolled</th><th>Certified</th><th>Cert %</th><th>Placed</th><th>Placement %</th><th>Dropped</th><th>Performance</th></tr></thead>
                <tbody>
                  {rows.map(([d, r]) => {
                    const certPct = r.enrolled ? Math.round(r.certified / r.enrolled * 100) : 0;
                    const placePct = r.certified ? Math.round(r.placed / r.certified * 100) : 0;
                    const perf = certPct >= 70 && placePct >= 70 ? 'Excellent' : certPct >= 50 ? 'Good' : 'Needs Attention';
                    return (
                      <tr key={d}>
                        <td style={{ fontWeight: 700 }}>{d}</td>
                        <td>{r.enrolled}</td>
                        <td>{r.certified}</td>
                        <td><span className={`pill ${certPct >= 70 ? 'green' : certPct >= 50 ? 'amber' : 'red'}`}>{certPct}%</span></td>
                        <td>{r.placed}</td>
                        <td><span className={`pill ${placePct >= 70 ? 'green' : placePct >= 50 ? 'amber' : 'red'}`}>{placePct}%</span></td>
                        <td>{r.dropped > 0 ? <span className="pill red">{r.dropped}</span> : <span className="pill green">0</span>}</td>
                        <td><span className={`pill ${perf === 'Excellent' ? 'green' : perf === 'Good' ? 'blue' : 'red'}`}>{perf}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
          }
        </div>
      </>
    );
  };

  // ── 13. AUDIT LOGS ──
  const renderAuditLogs = () => {
    const exportCSV = () => {
      const hdr = 'Timestamp,User,Action,Entity,IP\n';
      const body = auditLogs.map(l => `"${l.created_at}","${l.user_name||l.user||''}","${l.action}","${l.entity_type||''}","${l.ip_address||''}"`).join('\n');
      const url = URL.createObjectURL(new Blob([hdr + body], { type: 'text/csv' }));
      Object.assign(document.createElement('a'), { href: url, download: 'audit-logs.csv' }).click();
      URL.revokeObjectURL(url);
    };
    return (
      <>
        <div className="sg-ph"><h1>Audit Logs</h1><p>Complete activity trail for compliance and accountability</p></div>
        <div className="sg-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div className="sg-card-title" style={{ margin: 0 }}>Activity Log</div>
            <button className="sg-btn sg-btn-outline sg-btn-sm" onClick={exportCSV}>📥 Export CSV</button>
          </div>
          {auditLogs.length === 0
            ? <div className="sg-empty"><div className="icon">🔍</div><div>No audit log entries yet. Actions taken on this portal will appear here.</div></div>
            : <table>
                <thead><tr><th>Timestamp</th><th>User</th><th>Action</th><th>Entity</th><th>IP</th></tr></thead>
                <tbody>
                  {auditLogs.map((l, i) => (
                    <tr key={i}>
                      <td style={{ fontSize: '10.5px', color: '#6B7FA3', whiteSpace: 'nowrap' }}>{(l.created_at || '').replace('T', ' ').slice(0, 16)}</td>
                      <td style={{ fontWeight: 600, fontSize: '11px' }}>{l.user_name || l.user || '—'}</td>
                      <td style={{ fontSize: '11.5px' }}>{l.action}</td>
                      <td style={{ fontSize: '11px', color: '#3D5170' }}>{l.entity_type}{l.entity_id ? ` #${l.entity_id}` : ''}{l.detail ? ` — ${l.detail}` : ''}</td>
                      <td style={{ fontSize: '10.5px', color: '#94A3B8' }}>{l.ip_address || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
          }
        </div>
      </>
    );
  };

  // ── 14. USER MANAGEMENT ──
  const renderUsers = () => {
    const users = portalUsers;
    const active = users.filter(u => u.is_active !== 0);
    const inactive = users.filter(u => u.is_active === 0);
    return (
      <>
        <div className="sg-ph"><h1>User Management</h1><p>Manage state portal officers, district users and data entry operators</p></div>
        <div className="sg-kpi-grid">
          <div className="sg-kpi" style={{ '--c': '#003087' }}><div className="val">{users.length}</div><div className="lbl">Total Users</div></div>
          <div className="sg-kpi" style={{ '--c': '#007B5E' }}><div className="val">{active.length}</div><div className="lbl">Active</div></div>
          <div className="sg-kpi" style={{ '--c': '#DC2626' }}><div className="val">{inactive.length}</div><div className="lbl">Inactive</div></div>
        </div>
        <div className="sg-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div className="sg-card-title" style={{ margin: 0 }}>Portal Users</div>
            <button className="sg-btn sg-btn-primary sg-btn-sm" onClick={() => showToast('User invitation is managed by the Super Admin', 'blue')}>+ Invite User</button>
          </div>
          {users.length === 0
            ? <div className="sg-empty"><div className="icon">👥</div><div>No state government users registered yet.</div></div>
            : <table>
                <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Location</th><th>Status</th><th>Joined</th></tr></thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td style={{ fontWeight: 700 }}>{u.name}</td>
                      <td style={{ fontSize: '11px', color: '#6B7FA3' }}>{u.email}</td>
                      <td><span className="pill blue" style={{ fontSize: 9 }}>{u.role?.replace(/_/g,' ')}</span></td>
                      <td>{u.location || u.org_name || '—'}</td>
                      <td>{pill(u.is_active !== 0 ? 'active' : 'inactive', { active: 'green', inactive: 'red' })}</td>
                      <td style={{ fontSize: '10.5px', color: '#94A3B8' }}>{(u.created_at || '').slice(0,10)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
          }
        </div>
      </>
    );
  };

  // ── Training Centres ──
  const renderTrainingCentres = () => {
    const centres = tps.length ? tps.flatMap(tp =>
      Array.from({ length: tp.centre_count || 0 }, (_, i) => ({
        name: `${tp.name} — Centre ${i + 1}`,
        tp: tp.name, district: tp.district, scheme: tp.scheme, status: tp.status
      }))
    ) : [];
    return (
      <>
        <div className="sg-ph"><h1>Training Centres</h1><p>All registered training centre locations across the state</p></div>
        <div className="sg-kpi-grid">
          <div className="sg-kpi" style={{ '--c': '#003087' }}><div className="val">{tps.reduce((s, t) => s + (t.centre_count || 0), 0)}</div><div className="lbl">Total Centres</div></div>
          <div className="sg-kpi" style={{ '--c': '#007B5E' }}><div className="val">{tps.filter(t => t.status === 'verified').reduce((s, t) => s + (t.centre_count || 0), 0)}</div><div className="lbl">Active Centres</div></div>
          <div className="sg-kpi" style={{ '--c': '#FF6B00' }}><div className="val">{[...new Set(tps.map(t => t.district).filter(Boolean))].length}</div><div className="lbl">Districts Covered</div></div>
        </div>
        <div className="sg-card">
          <div className="sg-card-title">📍 Centre Registry</div>
          {tps.length === 0
            ? <div className="sg-empty"><div className="icon">📍</div><div>No training partners registered. Add TPs to see their centres.</div></div>
            : <table>
                <thead><tr><th>Training Partner</th><th>District</th><th>Scheme</th><th>Centres</th><th>Trainers</th><th>Status</th></tr></thead>
                <tbody>
                  {tps.map(tp => (
                    <tr key={tp.id}>
                      <td style={{ fontWeight: 700 }}>{tp.name}</td>
                      <td>{tp.district}</td>
                      <td><span className="pill blue" style={{ fontSize: 9 }}>{tp.scheme}</span></td>
                      <td style={{ fontWeight: 700, color: '#003087' }}>{tp.centre_count || 0}</td>
                      <td>{tp.trainee_count || 0}</td>
                      <td>{pill(tp.status, { verified: 'green', pending: 'amber', suspended: 'red' })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
          }
        </div>
      </>
    );
  };

  const renderCentreMap = () => (
    <>
      <div className="sg-ph"><h1>District Map View</h1><p>Geographical spread of training centres across districts</p></div>
      <div className="sg-card">
        <div className="sg-card-title">🗺️ District Coverage Summary</div>
        {[...new Set(tps.map(t => t.district).filter(Boolean))].map(d => {
          const distTPs = tps.filter(t => t.district === d);
          const centres = distTPs.reduce((s, t) => s + (t.centre_count || 0), 0);
          return (
            <div key={d} className="sg-stat-row">
              <span className="lbl">📍 {d}</span>
              <span style={{ display: 'flex', gap: 8 }}>
                <span className="pill blue">{distTPs.length} TPs</span>
                <span className="pill green">{centres} centres</span>
              </span>
            </div>
          );
        })}
        {tps.length === 0 && <div className="sg-empty"><div className="icon">🗺️</div><div>No coverage data yet.</div></div>}
      </div>
    </>
  );

  // ── Trainers & Assessors ──
  const renderTrainers = () => {
    const mockTrainers = tps.filter(t => t.status === 'verified').flatMap((tp, ti) =>
      Array.from({ length: Math.min(tp.trainee_count || 2, 4) }, (_, i) => ({
        id: `TR-${tp.id}-${i}`,
        name: ['Suresh Kumar', 'Priya Mehta', 'Rajan Das', 'Anita Rao', 'Vikram Singh', 'Lakshmi Nair'][( ti * 4 + i) % 6],
        qualification: ['B.Tech', 'Diploma', 'ITI', 'M.Sc'][i % 4],
        sector: tp.scheme, tp: tp.name, district: tp.district,
        certified: i % 3 !== 2, exp: `${2 + i} yrs`
      }))
    );
    return (
      <>
        <div className="sg-ph"><h1>Trainer Registry</h1><p>All certified trainers across training partners in the state</p></div>
        <div className="sg-kpi-grid">
          <div className="sg-kpi" style={{ '--c': '#003087' }}><div className="val">{mockTrainers.length}</div><div className="lbl">Total Trainers</div></div>
          <div className="sg-kpi" style={{ '--c': '#007B5E' }}><div className="val">{mockTrainers.filter(t => t.certified).length}</div><div className="lbl">NSQF Certified</div></div>
          <div className="sg-kpi" style={{ '--c': '#FF6B00' }}><div className="val">{mockTrainers.filter(t => !t.certified).length}</div><div className="lbl">Certification Pending</div></div>
        </div>
        <div className="sg-card">
          <div className="sg-card-title">👨‍🏫 Trainer List</div>
          {mockTrainers.length === 0
            ? <div className="sg-empty"><div className="icon">👨‍🏫</div><div>No trainers data. Approve TPs to populate trainer registry.</div></div>
            : <table>
                <thead><tr><th>ID</th><th>Name</th><th>Qualification</th><th>Sector/Scheme</th><th>Training Partner</th><th>District</th><th>Experience</th><th>NSQF Status</th></tr></thead>
                <tbody>
                  {mockTrainers.map(t => (
                    <tr key={t.id}>
                      <td style={{ fontSize: '10px', color: '#6B7FA3' }}>{t.id}</td>
                      <td style={{ fontWeight: 700 }}>{t.name}</td>
                      <td>{t.qualification}</td>
                      <td><span className="pill blue" style={{ fontSize: 9 }}>{t.sector}</span></td>
                      <td style={{ fontSize: '11px' }}>{t.tp}</td>
                      <td>{t.district}</td>
                      <td style={{ color: '#6B7FA3' }}>{t.exp}</td>
                      <td>{t.certified ? <span className="pill green">Certified</span> : <span className="pill amber">Pending</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
          }
        </div>
      </>
    );
  };

  const renderAssessors = () => {
    const mockAssessors = tps.filter(t => t.status === 'verified').map((tp, i) => ({
      id: `ASS-TG-${String(i + 1).padStart(3, '0')}`,
      name: ['Deepak Verma', 'Sunita Patel', 'Ravi Shankar', 'Meena Joshi'][i % 4],
      agency: ['NSDC Assessment Wing', 'CIEL HR', 'TUV SUD', 'NABET'][i % 4],
      sector: tp.scheme, district: tp.district, empanelled: i % 4 !== 3
    }));
    return (
      <>
        <div className="sg-ph"><h1>Assessor Registry</h1><p>Empanelled assessors for skill certification assessments</p></div>
        <div className="sg-kpi-grid">
          <div className="sg-kpi" style={{ '--c': '#003087' }}><div className="val">{mockAssessors.length}</div><div className="lbl">Total Assessors</div></div>
          <div className="sg-kpi" style={{ '--c': '#007B5E' }}><div className="val">{mockAssessors.filter(a => a.empanelled).length}</div><div className="lbl">Empanelled</div></div>
          <div className="sg-kpi" style={{ '--c': '#DC2626' }}><div className="val">{mockAssessors.filter(a => !a.empanelled).length}</div><div className="lbl">Lapsed</div></div>
        </div>
        <div className="sg-card">
          <div className="sg-card-title">📋 Assessor List</div>
          {mockAssessors.length === 0
            ? <div className="sg-empty"><div className="icon">📋</div><div>No assessors registered yet.</div></div>
            : <table>
                <thead><tr><th>ID</th><th>Name</th><th>Assessment Agency</th><th>Sector</th><th>District</th><th>Status</th></tr></thead>
                <tbody>
                  {mockAssessors.map(a => (
                    <tr key={a.id}>
                      <td style={{ fontSize: '10px', color: '#6B7FA3' }}>{a.id}</td>
                      <td style={{ fontWeight: 700 }}>{a.name}</td>
                      <td style={{ fontSize: '11px' }}>{a.agency}</td>
                      <td><span className="pill blue" style={{ fontSize: 9 }}>{a.sector}</span></td>
                      <td>{a.district}</td>
                      <td>{a.empanelled ? <span className="pill green">Active</span> : <span className="pill red">Lapsed</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
          }
        </div>
      </>
    );
  };

  const renderPanel = () => {
    switch (activePanel) {
      case 'dashboard': return renderDashboard();
      case 'notifications': return renderNotifications();
      case 'live-analytics': return renderLiveAnalytics();
      case 'pmkvy': return renderSchemeDetail('PMKVY', 'PMKVY 4.0', '📋', 'Ministry of Skill Development & Entrepreneurship', 'Pradhan Mantri Kaushal Vikas Yojana 4.0');
      case 'ddu-gky': return renderSchemeDetail('DDU-GKY', 'DDU-GKY', '🌾', 'Ministry of Rural Development', 'Deen Dayal Upadhyaya Grameen Kaushalya Yojana');
      case 'naps': return renderSchemeDetail('NAPS', 'NAPS', '📝', 'Ministry of Skill Development', 'National Apprenticeship Promotion Scheme');
      case 'state-scheme': return renderSchemeDetail('STATE', 'State Skill Mission', '🏛️', 'Telangana State Skill Dev Corporation', 'State-funded skill development program');
      case 'csr-programs': return renderSchemeDetail('CSR', 'CSR Programs', '🤝', 'Corporate Social Responsibility', 'Industry-funded skilling programs');
      case 'targets': return renderTargets();
      case 'financial': return renderFinancial();
      case 'tp-list': return renderTPs();
      case 'tp-onboard': return renderTPOnboard();
      case 'tp-verify': return renderTPVerify();
      case 'tc-list': return renderTrainingCentres();
      case 'tc-map': return renderCentreMap();
      case 'trainer-list': return renderTrainers();
      case 'assessor-list': return renderAssessors();
      case 'candidate-list': return renderCandidates();
      case 'enrolment': return renderEnrolment();
      case 'placements': return renderPlacements();
      case 'dropouts': return renderDropouts();
      case 'cert-verify': return renderCertVerify();
      case 'grievances': return renderGrievances();
      case 'sectors': return renderSectors();
      case 'employers': return renderEmployers();
      case 'mis-monthly': return renderMisMonthly();
      case 'mis-district': return renderMisDistrict();
      case 'mis-scheme': return renderMis();
      case 'audit-logs': return renderAuditLogs();
      case 'users': return renderUsers();
      case 'settings': return renderSettings();
      default: return (
        <>
          <div className="sg-ph"><h1>{CRUMBS[activePanel] || activePanel}</h1></div>
          <div className="sg-card" style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#003087' }}>{CRUMBS[activePanel] || activePanel}</div>
            <div style={{ fontSize: 12, color: '#6B7FA3', marginTop: 6 }}>No data to display yet for this section.</div>
          </div>
        </>
      );
    }
  };

  // ── MODALS ──
  const renderModal = () => {
    if (!modal) return null;

    if (modal === 'add-tp') return (
      <Modal title="Add Training Partner" onClose={() => setModal(null)}>
        <div className="sg-form-grid">
          {[['name','TP Name *'],['type','Type (Pvt/NGO/Society)'],['district','District'],['state_name','State'],['scheme','Scheme (PMKVY/DDU-GKY)'],['nsdc_code','NSDC Code'],['email','Email'],['mobile','Mobile'],['accreditation','Accreditation'],['accreditation_expiry','Accreditation Expiry']].map(([k, lbl]) => (
            <div className="sg-form-group" key={k}><label>{lbl}</label><input value={form[k] || ''} onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))} /></div>
          ))}
        </div>
        <div className="sg-modal-actions">
          <button className="sg-btn sg-btn-outline" onClick={() => setModal(null)}>Cancel</button>
          <button className="sg-btn sg-btn-primary" onClick={async () => {
            if (!form.name) return showToast('TP name is required', 'red');
            const nameErr = fieldValidate('name', form.name); if (nameErr) return showToast(nameErr, 'red');
            await api.sgCreateTP(form); showToast('Training partner added'); setModal(null); loadTPs(); loadStats();
          }}>Save TP</button>
        </div>
      </Modal>
    );

    if (modal === 'edit-tp') return (
      <Modal title="Edit Training Partner" onClose={() => setModal(null)}>
        <div className="sg-form-grid">
          {[['name','TP Name'],['type','Type'],['district','District'],['scheme','Scheme'],['accreditation','Accreditation']].map(([k, lbl]) => (
            <div className="sg-form-group" key={k}><label>{lbl}</label><input value={form[k] || ''} onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))} /></div>
          ))}
          <div className="sg-form-group"><label>Status</label>
            <select value={form.status || 'pending'} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
              {['pending','verified','suspended','blacklisted'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="sg-modal-actions">
          <button className="sg-btn sg-btn-outline" onClick={() => setModal(null)}>Cancel</button>
          <button className="sg-btn sg-btn-primary" onClick={async () => {
            await api.sgUpdateTP(form.id, form); showToast('TP updated'); setModal(null); loadTPs();
          }}>Update</button>
        </div>
      </Modal>
    );

    if (modal === 'add-candidate') return (
      <Modal title="Enrol Beneficiary" onClose={() => setModal(null)}>
        <div className="sg-form-grid">
          {[['name','Full Name *'],['gender','Gender (M/F/Other)'],['dob','Date of Birth'],['district','District'],['state_name','State'],['mobile','Mobile'],['aadhaar_masked','Aadhaar (Last 4)'],['scheme','Scheme'],['course','Course Name']].map(([k, lbl]) => (
            <div className="sg-form-group" key={k}><label>{lbl}</label><input value={form[k] || ''} onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))} /></div>
          ))}
          <div className="sg-form-group">
            <label>Batch</label>
            <select value={form.batch_id || ''} onChange={e => {
              const b = allBatches.find(x => String(x.id) === e.target.value);
              setForm(p => ({ ...p, batch_id: e.target.value || '', batch_code: b?.batch_code || '' }));
            }}>
              <option value="">— Select batch —</option>
              {allBatches.filter(b => b.status !== 'cancelled').map(b => (
                <option key={b.id} value={b.id}>{b.batch_code}{b.course_title ? ` · ${b.course_title}` : ''}{b.centre_name ? ` · ${b.centre_name}` : ''}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="sg-modal-actions">
          <button className="sg-btn sg-btn-outline" onClick={() => setModal(null)}>Cancel</button>
          <button className="sg-btn sg-btn-primary" onClick={async () => {
            if (!form.name) return showToast('Name is required', 'red');
            const cNameErr = fieldValidate('name', form.name); if (cNameErr) return showToast(cNameErr, 'red');
            await api.sgCreateCandidate(form); showToast('Candidate enrolled'); setModal(null); loadCandidates(); loadStats();
          }}>Enrol</button>
        </div>
      </Modal>
    );

    if (modal === 'update-candidate') return (
      <Modal title={`Update — ${form.name}`} onClose={() => setModal(null)}>
        <div className="sg-form-grid">
          <div className="sg-form-group"><label>Status</label>
            <select value={form.status || 'enrolled'} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
              {['enrolled','in-training','assessed','certified','placed','dropped'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="sg-form-group"><label>Placement Status</label>
            <select value={form.placement_status || 'not-placed'} onChange={e => setForm(p => ({ ...p, placement_status: e.target.value }))}>
              {['not-placed','placed'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="sg-form-group"><label>Employer Name</label><input value={form.employer_name || ''} onChange={e => setForm(p => ({ ...p, employer_name: e.target.value }))} /></div>
          <div className="sg-form-group"><label>Salary (₹/month)</label><input type="number" value={form.salary || ''} onChange={e => setForm(p => ({ ...p, salary: e.target.value }))} /></div>
        </div>
        <div className="sg-modal-actions">
          <button className="sg-btn sg-btn-outline" onClick={() => setModal(null)}>Cancel</button>
          <button className="sg-btn sg-btn-primary" onClick={async () => {
            await api.sgUpdateCandidate(form.id, form); showToast('Candidate updated'); setModal(null); loadCandidates(); loadStats();
          }}>Update</button>
        </div>
      </Modal>
    );

    if (modal === 'add-grievance') return (
      <Modal title="Log Grievance" onClose={() => setModal(null)}>
        <div className="sg-form-grid">
          {[['filed_by','Filed By'],['filer_type','Filer Type (Candidate/TP/Employer)'],['category','Category'],['district','District']].map(([k, lbl]) => (
            <div className="sg-form-group" key={k}><label>{lbl}</label><input value={form[k] || ''} onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))} /></div>
          ))}
          <div className="sg-form-group"><label>Priority</label>
            <select value={form.priority || 'medium'} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}>
              {['low','medium','high','urgent'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="sg-form-group" style={{ marginTop: 10 }}><label>Description</label>
          <textarea rows={3} value={form.description || ''} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} style={{ padding: '7px 10px', border: '1.5px solid #E2E8F0', borderRadius: 6, fontSize: 12, resize: 'vertical' }} />
        </div>
        <div className="sg-modal-actions">
          <button className="sg-btn sg-btn-outline" onClick={() => setModal(null)}>Cancel</button>
          <button className="sg-btn sg-btn-primary" onClick={async () => {
            await api.sgCreateGrievance(form); showToast('Grievance logged'); setModal(null); loadGrievances(); loadStats();
          }}>Submit</button>
        </div>
      </Modal>
    );

    if (modal === 'add-target') return (
      <Modal title="Set Scheme Target" onClose={() => setModal(null)}>
        <div className="sg-form-grid">
          <div className="sg-form-group"><label>Scheme</label>
            <select value={form.scheme_id || ''} onChange={e => setForm(p => ({ ...p, scheme_id: e.target.value }))}>
              <option value="">-- Select Scheme --</option>
              {(stats?.schemes || []).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          {[['fy','Financial Year (e.g. 2024-25)'],['annual_target','Annual Target'],['q1_target','Q1 Target'],['q2_target','Q2 Target'],['q3_target','Q3 Target'],['q4_target','Q4 Target']].map(([k, lbl]) => (
            <div className="sg-form-group" key={k}><label>{lbl}</label><input type={k === 'fy' ? 'text' : 'number'} value={form[k] || ''} onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))} /></div>
          ))}
        </div>
        <div className="sg-modal-actions">
          <button className="sg-btn sg-btn-outline" onClick={() => setModal(null)}>Cancel</button>
          <button className="sg-btn sg-btn-primary" onClick={async () => {
            if (!form.scheme_id || !form.fy) return showToast('Scheme and FY are required', 'red');
            if (!/^\d{4}-\d{2}$|^\d{4}-\d{4}$/.test((form.fy||'').trim())) return showToast('Financial year format should be like 2024-25 or 2024-2025', 'red');
            await api.sgCreateTarget(form); showToast('Target set'); setModal(null); loadTargets();
          }}>Save Target</button>
        </div>
      </Modal>
    );

    if (modal === 'add-disb') return (
      <Modal title="Initiate Disbursement" onClose={() => setModal(null)}>
        <div className="sg-form-grid">
          <div className="sg-form-group"><label>Training Partner</label>
            <select value={form.tp_id || ''} onChange={e => setForm(p => ({ ...p, tp_id: e.target.value }))}>
              <option value="">-- Select TP --</option>
              {tps.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          {[['scheme','Scheme'],['amount','Amount (₹) *'],['tranche','Tranche (Q1/Q2/Q3/Q4)'],['fy','Financial Year'],['disbursed_date','Disbursement Date'],['reference_no','Reference No']].map(([k, lbl]) => (
            <div className="sg-form-group" key={k}><label>{lbl}</label><input value={form[k] || ''} type={k === 'disbursed_date' ? 'date' : 'text'} onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))} /></div>
          ))}
        </div>
        <div className="sg-modal-actions">
          <button className="sg-btn sg-btn-outline" onClick={() => setModal(null)}>Cancel</button>
          <button className="sg-btn sg-btn-orange" onClick={async () => {
            if (!form.amount) return showToast('Amount is required', 'red');
            const amtErr = validatePositiveNum(form.amount, 'Amount', 1, 1e12); if (amtErr) return showToast(amtErr, 'red');
            await api.sgCreateDisbursement(form); showToast('Disbursement initiated'); setModal(null); loadDisbursements(); loadStats();
          }}>Initiate</button>
        </div>
      </Modal>
    );

    return null;
  };

  const initials = (name = '') => name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="sg-shell">

        {/* SIDEBAR */}
        <nav className="sg-sidebar">
          <div className="sg-brand">
            <div className="sg-brand-top">
              <div style={{ width:44, height:44, borderRadius:'50%', border:'2px solid #e0e8f4', background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', flexShrink:0 }}><img src="/logo.png" alt="Skills n Jobs" style={{ width:34, height:34, objectFit:'contain' }} /></div>
              <div><div className="sg-brand-name">Skill India Digital</div><div className="sg-brand-sub">State Government Portal</div></div>
            </div>
            <div className="sg-state-badge">
              <span style={{ fontSize: 18 }}>🏛️</span>
              <div className="sg-state-info">
                <div className="sg-state-name">{user?.org_name || 'State Government'}</div>
                <div className="sg-state-role">State Skill Mission Officer</div>
              </div>
              <div className="sg-online" />
            </div>
          </div>

          <div className="sg-sidebar-nav">
          <div className="sg-section">MAIN</div>
          <Nav id="dashboard" icon="🏠" label="Dashboard" />
          <Nav id="notifications" icon="🔔" label="Notifications" badge={stats?.notifUnread} />
          <Nav id="live-analytics" icon="📊" label="Live Analytics" />

          <div className="sg-section">SCHEME MANAGEMENT</div>
          <Nav icon="📋" label="Schemes & Programs" menuKey="schemes">
            {[['pmkvy','PMKVY 4.0'],['ddu-gky','DDU-GKY'],['naps','NAPS'],['state-scheme','State Skill Mission'],['csr-programs','CSR Programs']].map(([id, lbl]) => (
              <Child key={id} id={id} label={lbl} />
            ))}
          </Nav>
          <Nav id="targets" icon="🎯" label="Targets & Allocation" />
          <Nav id="financial" icon="💰" label="Financial Management" />

          <div className="sg-section">TRAINING ECOSYSTEM</div>
          <Nav icon="🏫" label="Training Partners" menuKey="tp">
            {[['tp-list','All TPs'],['tp-onboard','Onboarding & Approval'],['tp-verify','Accreditation & Verify']].map(([id, lbl]) => <Child key={id} id={id} label={lbl} />)}
          </Nav>
          <Nav icon="📍" label="Training Centers" menuKey="tc">
            {[['tc-list','All Centers'],['tc-map','District Map View']].map(([id, lbl]) => <Child key={id} id={id} label={lbl} />)}
          </Nav>
          <Nav icon="👨‍🏫" label="Trainers & Assessors" menuKey="trainers">
            {[['trainer-list','Trainer Registry'],['assessor-list','Assessor Registry']].map(([id, lbl]) => <Child key={id} id={id} label={lbl} />)}
          </Nav>

          <div className="sg-section">BENEFICIARY MANAGEMENT</div>
          <Nav icon="👤" label="Candidates / Learners" menuKey="cand">
            {[['candidate-list','All Beneficiaries'],['enrolment','Enrolment Records'],['placements','Placement Tracking'],['dropouts','Dropout Analysis']].map(([id, lbl]) => <Child key={id} id={id} label={lbl} />)}
          </Nav>
          <Nav id="cert-verify" icon="📜" label="Certificate Verification" />
          <Nav id="grievances" icon="🤝" label="Grievance Redressal" badge={stats?.grievOpen} />

          <div className="sg-section">SECTORS & EMPLOYMENT</div>
          <Nav id="sectors" icon="🏭" label="Sector-wise Data" />
          <Nav id="employers" icon="🏢" label="Employer Partners" />

          <div className="sg-section">MIS & REPORTS</div>
          <Nav icon="📈" label="MIS Reports" menuKey="mis">
            {[['mis-monthly','Monthly MIS'],['mis-district','District Report'],['mis-scheme','Scheme-wise MIS']].map(([id, lbl]) => <Child key={id} id={id} label={lbl} />)}
          </Nav>
          <Nav id="audit-logs" icon="🔍" label="Audit Logs" />

          <div className="sg-section">ADMINISTRATION</div>
          <Nav id="users" icon="👥" label="User Management" />
          <Nav id="settings" icon="⚙️" label="Settings" />

          </div>{/* end sg-sidebar-nav */}
        </nav>

        {/* MAIN */}
        <div className="sg-main">
          <div className="sg-topbar">
            <div className="sg-tb-left">
              <span>State Portal</span><span>›</span>
              <span className="sg-tb-crumb">{CRUMBS[activePanel] || activePanel}</span>
            </div>
            <div style={{ flex:1, maxWidth:380, margin:'0 16px', position:'relative' }}>
              <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', fontSize:14, color:'#94A3B8', pointerEvents:'none' }}>🔍</span>
              <input
                type="search"
                placeholder="Search schemes, districts, reports…"
                style={{ width:'100%', padding:'7px 12px 7px 32px', border:'1.5px solid #E2E8F0', borderRadius:8, fontSize:13, color:'#1A2B4A', outline:'none', background:'#F8FAFC', boxSizing:'border-box' }}
              />
            </div>
            <div className="sg-tb-right">
              <div className="sg-scheme-tag">{user?.org_name || 'State Skill Mission'}</div>
              <button className="sg-tb-btn" onClick={() => navigate('mis-scheme')}>📥 MIS Report</button>
              <div className="sg-tb-icon" onClick={() => navigate('notifications')}>
                🔔{stats?.notifUnread > 0 && <span className="notif-dot" />}
              </div>
              <div className="sg-tb-icon">👤</div>
              <button onClick={() => { logout(); routerNavigate('/'); }} style={{ padding:'7px 16px', borderRadius:8, border:'none', background:'#1E5FBF', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:5 }}>⏻ Sign Out</button>
            </div>
          </div>

          <div className="sg-content">
            {renderPanel()}
          </div>
        </div>

        {renderModal()}

        {/* Toast */}
        {toast && (
          <div style={{ position: 'fixed', bottom: 24, right: 24, background: toast.type === 'red' ? '#EF4444' : '#22C55E', color: '#fff', padding: '10px 18px', borderRadius: 8, fontWeight: 700, fontSize: 13, zIndex: 9999, boxShadow: '0 4px 12px rgba(0,0,0,.2)' }}>
            {toast.type === 'red' ? '❌' : '✅'} {toast.msg}
          </div>
        )}
      </div>
    </>
  );
}
