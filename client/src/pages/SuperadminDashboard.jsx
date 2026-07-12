import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';

const CSS = `
  .sa-wrap *{box-sizing:border-box;margin:0;padding:0}
  .sa-wrap{font-family:'Inter',system-ui,sans-serif;background:#F4F6F9;color:#1A2B4A;display:flex;height:100vh;overflow:hidden;font-size:13px}
  .sa-sidebar{width:220px;min-width:220px;background:#010E3C;display:flex;flex-direction:column;height:100vh;overflow:hidden;flex-shrink:0}
  .sa-logo{padding:0 16px;height:58px;display:flex;align-items:center;gap:10px;border-bottom:1px solid rgba(255,255,255,.12);cursor:pointer;flex-shrink:0}
  .sa-logo .brand-name{color:#fff;font-weight:800;font-size:13px;line-height:1.1}
  .sa-logo .brand-tag{color:rgba(255,255,255,.45);font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.1em}
  .sa-nav{flex:1;overflow-y:auto;padding:6px 0}
  .sa-nav::-webkit-scrollbar{width:4px}
  .sa-nav::-webkit-scrollbar-thumb{background:rgba(255,255,255,.2);border-radius:4px}
  .sa-section{padding:10px 14px 3px;color:rgba(255,255,255,.4);font-size:9.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;display:flex;align-items:center;justify-content:space-between;cursor:pointer;user-select:none;border-radius:4px;margin:0 4px;transition:background .12s}
  .sa-section:hover{background:rgba(255,255,255,.06);color:rgba(255,255,255,.6)}
  .sa-section .sa-sec-chev{font-size:9px;transition:transform .2s;opacity:.6}
  .sa-sec-items{overflow:hidden;transition:max-height .25s ease}
  .sa-item{display:flex;align-items:center;gap:9px;padding:7px 10px;margin:1px 6px;cursor:pointer;border-radius:6px;color:rgba(255,255,255,.82);font-size:12.5px;font-weight:500;transition:background .12s;user-select:none}
  .sa-item:hover{background:rgba(255,255,255,.1)}
  .sa-item.active{background:rgba(255,255,255,.22);color:#fff;font-weight:700}
  .sa-item.parent-active{background:rgba(255,255,255,.12);color:#fff}
  .sa-item .sa-icon{font-size:15px;flex-shrink:0;width:20px;text-align:center}
  .sa-item .sa-lbl{flex:1}
  .sa-item .sa-chev{font-size:10px;color:rgba(255,255,255,.45);transition:transform .18s;flex-shrink:0}
  .sa-item .sa-badge{background:#DC2626;color:#fff;font-size:9px;font-weight:700;padding:1px 5px;border-radius:10px;flex-shrink:0}
  .sa-item .sa-tag{display:inline-flex;align-items:center;padding:1px 6px;border-radius:4px;font-size:9px;font-weight:700;margin-left:4px}
  .sa-item .sa-tag.new{background:#D1FAE5;color:#065F46}
  .sa-item .sa-tag.soon{background:#FEF3C7;color:#92400E}
  .sa-children{overflow:hidden;max-height:0;transition:max-height .28s ease}
  .sa-children.open{max-height:600px}
  .sa-child{display:flex;align-items:center;gap:8px;padding:5px 10px 5px 37px;margin:1px 6px;cursor:pointer;border-radius:5px;color:rgba(255,255,255,.65);font-size:12px;transition:background .12s}
  .sa-child:hover{background:rgba(255,255,255,.1);color:#fff}
  .sa-child.active{background:rgba(255,255,255,.18);color:#fff;font-weight:600}
  .sa-footer{padding:10px 12px;border-top:1px solid rgba(255,255,255,.12);display:flex;align-items:center;gap:9px;flex-shrink:0}
  .sa-avatar{width:30px;height:30px;border-radius:50%;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;font-weight:700;flex-shrink:0}
  .sa-footer .sa-uname{color:rgba(255,255,255,.9);font-size:11px;font-weight:700}
  .sa-footer .sa-urole{color:rgba(255,255,255,.42);font-size:9.5px;text-transform:capitalize}
  .sa-main{flex:1;display:flex;flex-direction:column;overflow:hidden;min-width:0}
  .sa-topbar{height:56px;background:#fff;border-bottom:1px solid #E0E6EF;display:flex;align-items:center;padding:0 22px;gap:14px;flex-shrink:0;box-shadow:0 1px 4px rgba(10,45,110,.05)}
  .sa-topbar .sa-breadcrumb{flex:1;display:flex;align-items:baseline;gap:6px}
  .sa-topbar .sa-tb-section{font-size:11px;color:#6B7FA3;font-weight:500}
  .sa-topbar .sa-tb-title{font-size:15px;font-weight:800;color:#003366}
  .sa-topbar .sa-actions{display:flex;align-items:center;gap:10px}
  .sa-topbar .sa-user-info{display:flex;align-items:center;gap:7px}
  .sa-topbar .sa-av{width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#003366,#1A56C4);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:11px}
  .sa-topbar .sa-tb-uname{font-size:12px;font-weight:700;color:#1A2B4A}
  .sa-topbar .sa-tb-urole{font-size:10px;color:#6B7FA3}
  .sa-signout-btn{padding:7px 16px;border-radius:8px;border:none;background:#1E5FBF;color:#fff;font-size:13px;font-weight:600;cursor:pointer}
  .sa-content{flex:1;overflow-y:auto;padding:22px}
  /* Panel styles */
  .ph{margin-bottom:18px}
  .ph h1{font-size:20px;font-weight:800;color:#003366;margin-bottom:3px}
  .ph p{font-size:12px;color:#6B7FA3}
  .kpi-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-bottom:18px}
  .kpi{background:#fff;border:1px solid #E0E6EF;border-radius:10px;padding:14px 16px;border-top:3px solid var(--c)}
  .kpi .val{font-size:26px;font-weight:800;color:var(--c);line-height:1}
  .kpi .lbl{font-size:11px;color:#3D5170;font-weight:600;margin-top:5px}
  .kpi .sub{font-size:10px;color:var(--c);font-weight:700;margin-top:3px}
  .grid2{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px}
  .grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:14px}
  .card{background:#fff;border:1px solid #E0E6EF;border-radius:10px;padding:16px;margin-bottom:14px}
  .card-title{font-size:11px;font-weight:700;color:#6B7FA3;text-transform:uppercase;letter-spacing:.5px;margin-bottom:12px}
  .card-hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
  .sa-table{width:100%;border-collapse:collapse;font-size:12px}
  .sa-table thead tr{background:#010E3C}
  .sa-table thead th{padding:9px 12px;color:rgba(255,255,255,.85);font-weight:700;text-align:left;font-size:11px}
  .sa-table tbody tr{border-bottom:1px solid #F1F5F9}
  .sa-table tbody tr:hover{background:#F8FAFC}
  .sa-table tbody td{padding:9px 12px;color:#1A2B4A}
  .pill{display:inline-flex;align-items:center;padding:2px 9px;border-radius:20px;font-size:10.5px;font-weight:700}
  .pill.green{background:#D1FAE5;color:#065F46}
  .pill.amber{background:#FEF3C7;color:#92400E}
  .pill.red{background:#FEE2E2;color:#991B1B}
  .pill.blue{background:#DBEAFE;color:#1E40AF}
  .pill.gray{background:#F1F5F9;color:#475569}
  .pill.purple{background:#EDE9FE;color:#5B21B6}
  .stat-row{display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid #F1F5F9}
  .stat-row:last-child{border:none}
  .prog-bar{height:6px;background:#E0E6EF;border-radius:3px;margin-top:4px;overflow:hidden}
  .prog-fill{height:100%;border-radius:3px}
  .sa-btn{display:inline-flex;align-items:center;gap:5px;padding:7px 14px;border-radius:7px;border:none;font-size:12px;font-weight:700;cursor:pointer}
  .sa-btn:hover{opacity:.85}
  .btn-primary{background:#010E3C;color:#fff}
  .btn-teal{background:#007B5E;color:#fff}
  .btn-outline{background:#fff;color:#003366;border:1.5px solid #E0E6EF}
  .btn-danger{background:#DC2626;color:#fff}
  .empty-state{text-align:center;padding:40px;color:#94A3B8}
  .empty-state .ei{font-size:36px;margin-bottom:10px}
  .loading{padding:20px;color:#94A3B8;text-align:center;font-size:12px}
`;

const NAV = [
  { section: 'MAIN', items: [
    { id: 'dashboard', icon: '🏠', label: 'Dashboard' },
    { id: 'notifications', icon: '🔔', label: 'Notifications', badge: 5 },
    { id: 'analytics', icon: '📈', label: 'Live Analytics', tag: 'New', tagType: 'new' },
  ]},
  { section: 'USER MANAGEMENT', items: [
    { id: 'users-all', icon: '👥', label: 'All Users', children: [
      { id: 'users-candidates', label: 'Candidates / Learners' },
      { id: 'users-tp', label: 'Training Partners' },
      { id: 'users-trainers', label: 'Trainers & Assessors' },
      { id: 'users-employers', label: 'Employers' },
      { id: 'users-csr', label: 'CSR Organizations' },
      { id: 'users-placement', label: 'Placement Agencies' },
      { id: 'users-govt', label: 'Government Officials' },
    ]},
    { id: 'roles', icon: '🔑', label: 'Roles & Permissions' },
    { id: 'bulk-import', icon: '📥', label: 'Bulk Import / Export' },
  ]},
  { section: 'TRAINING ECOSYSTEM', items: [
    { id: 'tp-registry', icon: '🏫', label: 'Training Partners', children: [
      { id: 'tp-list', label: 'Partner Registry' },
      { id: 'tp-verify', label: 'Verification Queue' },
      { id: 'tp-accred', label: 'Accreditation Status' },
      { id: 'tp-perf', label: 'Performance Dashboard' },
    ]},
    { id: 'centers', icon: '📍', label: 'Training Centers', children: [
      { id: 'centers-list', label: 'Center Registry' },
      { id: 'centers-audit', label: 'Infrastructure Audit' },
      { id: 'centers-geo', label: 'Geo-Mapping' },
    ]},
    { id: 'trainers', icon: '👨‍🏫', label: 'Trainers & Assessors', children: [
      { id: 'tr-list', label: 'Trainer Registry' },
      { id: 'tr-assess', label: 'Assessor Registry' },
      { id: 'tr-certs', label: 'Certifications & Badges' },
    ]},
    { id: 'sessions', icon: '📅', label: 'Session Management', children: [
      { id: 'sessions-all', label: 'All Sessions' },
      { id: 'sessions-schedule', label: 'Schedule Session' },
      { id: 'sessions-attendance', label: 'Attendance Tracking' },
      { id: 'sessions-content', label: 'Course Content & Materials' },
    ]},
  ]},
  { section: 'COURSES & CURRICULUM', items: [
    { id: 'courses', icon: '📚', label: 'Courses', children: [
      { id: 'course-catalogue', label: 'Course Catalogue' },
      { id: 'course-nsqf', label: 'NSQF Framework' },
      { id: 'course-approve', label: 'Approval Queue' },
      { id: 'course-upload', label: 'Curriculum Upload' },
    ]},
    { id: 'sectors', icon: '🏭', label: 'Sectors & Job Roles' },
  ]},
  { section: 'SCHEMES & PROGRAMS', items: [
    { id: 'pmkvy', icon: '🇮🇳', label: 'PMKVY 4.0' },
    { id: 'ddugky', icon: '🌾', label: 'DDU-GKY' },
    { id: 'naps', icon: '🔧', label: 'NAPS (Apprenticeship)' },
    { id: 'state-skill', icon: '🏛️', label: 'State Skill Missions' },
    { id: 'csr-prog', icon: '🤝', label: 'CSR-Funded Programs' },
    { id: 'fee-prog', icon: '💰', label: 'Fee-Based Programs' },
    { id: 'scheme-config', icon: '⚙️', label: 'Scheme Configuration' },
  ]},
  { section: 'CSR MANAGEMENT', items: [
    { id: 'csr-projects', icon: '📂', label: 'CSR Projects', children: [
      { id: 'csr-proj-active', label: 'Active Projects' },
      { id: 'csr-proj-draft', label: 'Draft Projects' },
      { id: 'csr-proj-completed', label: 'Completed Projects' },
      { id: 'csr-proj-approval', label: 'Approval Queue' },
    ]},
    { id: 'csr-orgs', icon: '🏢', label: 'CSR Organisations' },
    { id: 'csr-beneficiaries', icon: '👥', label: 'CSR Beneficiaries', children: [
      { id: 'csr-bene-list', label: 'Beneficiary List' },
      { id: 'csr-bene-track', label: 'Track Progress' },
      { id: 'csr-bene-outcomes', label: 'Placement Outcomes' },
    ]},
    { id: 'csr-funds', icon: '💰', label: 'CSR Fund Management', children: [
      { id: 'csr-fund-alloc', label: 'Fund Allocation' },
      { id: 'csr-fund-disbursed', label: 'Disbursements' },
      { id: 'csr-fund-utilization', label: 'Utilization Reports' },
      { id: 'csr-fund-unspent', label: 'Unspent Funds' },
    ]},
    { id: 'csr-impact', icon: '📈', label: 'Impact Reports' },
  ]},
  { section: 'CANDIDATES & ENROLMENT', items: [
    { id: 'candidate-reg', icon: '👤', label: 'Candidate Registry' },
    { id: 'skill-passport', icon: '🏅', label: 'Skill Passport', tag: 'New', tagType: 'new' },
    { id: 'enrolments', icon: '📋', label: 'Enrolments' },
    { id: 'batches', icon: '📅', label: 'Batch Management' },
    { id: 'attendance', icon: '✅', label: 'Attendance' },
    { id: 'dropout', icon: '⚠️', label: 'Dropout Management' },
    { id: 'target-ben', icon: '🎯', label: 'Target Beneficiaries' },
    { id: 'financial-aid', icon: '💳', label: 'Financial Assistance' },
    { id: 'career-services', icon: '🚀', label: 'Career Services', children: [
      { id: 'career-counseling', label: 'Career Counselling' },
      { id: 'career-resume', label: 'Resume Builder' },
      { id: 'career-mock', label: 'Mock Interviews' },
      { id: 'career-mentor', label: 'Mentorship' },
    ]},
  ]},
  { section: 'ASSESSMENTS & CERTIFICATIONS', items: [
    { id: 'assess-agencies', icon: '🏅', label: 'Assessment Agencies' },
    { id: 'assess-sched', icon: '📆', label: 'Scheduled Assessments' },
    { id: 'results', icon: '📊', label: 'Results & Marks' },
    { id: 'certificates', icon: '📜', label: 'Certificate Generation' },
    { id: 'cert-verify', icon: '🔍', label: 'Certificate Verification' },
    { id: 'badges', icon: '🎖️', label: 'Digital Badges', tag: 'Soon', tagType: 'soon' },
  ]},
  { section: 'PLACEMENTS & EMPLOYMENT', items: [
    { id: 'jobs', icon: '💼', label: 'Job Marketplace' },
    { id: 'employers', icon: '🏢', label: 'Employer Registry' },
    { id: 'placements', icon: '🎯', label: 'Placement Records' },
    { id: 'place-partners', icon: '🤝', label: 'Placement Partners' },
    { id: 'emp-verify', icon: '✔️', label: 'Employment Verification' },
    { id: 'apprentice', icon: '🔧', label: 'Apprenticeship Portal' },
    { id: 'skill-dev', icon: '💡', label: 'Skill Gap & Development', children: [
      { id: 'skill-gap', label: 'Skill Gap Analysis' },
      { id: 'skill-tp-connect', label: 'Training Partner Connect' },
      { id: 'skill-requirements', label: 'Training Requirements' },
      { id: 'skill-pmkvy', label: 'PMKVY Partnership' },
    ]},
  ]},
  { section: 'COLLABORATION', items: [
    { id: 'collab-consortium', icon: '🏗️', label: 'Consortium Builder' },
    { id: 'collab-partnership', icon: '🤝', label: 'Partnership Requests' },
    { id: 'collab-resources', icon: '📦', label: 'Resource Sharing' },
    { id: 'collab-invitations', icon: '✉️', label: 'Invitations' },
  ]},
  { section: 'FINANCIAL MANAGEMENT', items: [
    { id: 'fund-alloc', icon: '💵', label: 'Fund Allocation' },
    { id: 'disbursements', icon: '🏦', label: 'Disbursements' },
    { id: 'claims', icon: '📄', label: 'Training Cost Claims' },
    { id: 'scheme-budget', icon: '📊', label: 'Scheme-wise Budgets' },
    { id: 'fin-audit', icon: '🔎', label: 'Audit & Compliance' },
    { id: 'pay-reports', icon: '📑', label: 'Payment Reports' },
  ]},
  { section: 'GRIEVANCE & SUPPORT', items: [
    { id: 'grievance-all', icon: '📣', label: 'Grievance Management', children: [
      { id: 'grievance-open', label: 'Open Grievances' },
      { id: 'grievance-resolved', label: 'Resolved' },
      { id: 'grievance-escalated', label: 'Escalated' },
    ]},
    { id: 'helpdesk', icon: '🎧', label: 'Help Desk / Support Tickets' },
    { id: 'faq-mgmt', icon: '❓', label: 'FAQ Management' },
  ]},
  { section: 'REPORTS & ANALYTICS', items: [
    { id: 'mis', icon: '📊', label: 'MIS Dashboard' },
    { id: 'sector-rpt', icon: '🏭', label: 'Sector-wise Reports' },
    { id: 'state-rpt', icon: '🗺️', label: 'State-wise Reports' },
    { id: 'scheme-rpt', icon: '📋', label: 'Scheme Reports' },
    { id: 'place-analytics', icon: '📈', label: 'Placement Analytics' },
    { id: 'export', icon: '📤', label: 'Export Centre' },
    { id: 'custom-rpt', icon: '🛠️', label: 'Custom Report Builder', tag: 'New', tagType: 'new' },
  ]},
  { section: 'GEOGRAPHIC COVERAGE', items: [
    { id: 'geo-states', icon: '🗺️', label: 'States & Districts' },
    { id: 'geo-aspire', icon: '⭐', label: 'Aspirational Districts' },
    { id: 'geo-block', icon: '📌', label: 'Block-level Mapping' },
    { id: 'geo-rural', icon: '🌾', label: 'Rural / Urban Coverage' },
  ]},
  { section: 'CONTENT & COMMUNICATION', items: [
    { id: 'announce', icon: '📢', label: 'Announcements' },
    { id: 'push-notif', icon: '🔔', label: 'Push Notifications' },
    { id: 'email-tpl', icon: '✉️', label: 'Email Templates' },
    { id: 'faq', icon: '❓', label: 'FAQs & Help Centre' },
    { id: 'doc-lib', icon: '📁', label: 'Document Library' },
  ]},
  { section: 'SETUP & CONFIGURATION', items: [
    { id: 'setup-sectors', icon: '🏭', label: 'Sectors & Categories' },
    { id: 'setup-jobroles', icon: '👔', label: 'Job Roles (NSQF)' },
    { id: 'setup-accred', icon: '🏅', label: 'Accreditation Types' },
    { id: 'setup-orgclass', icon: '🏢', label: 'Organisation Classifications' },
    { id: 'setup-skills', icon: '💡', label: 'Skills Database' },
    { id: 'setup-schemes', icon: '📜', label: 'Government Schemes' },
    { id: 'audit-logs', icon: '📋', label: 'Audit Logs' },
    { id: 'sys-settings', icon: '⚙️', label: 'System Settings' },
    { id: 'api-config', icon: '🔗', label: 'API Configuration' },
  ]},
];

// ── small helpers ──────────────────────────────────────────────
function Pill({ v, map }) {
  const cls = (map || {})[v] || 'gray';
  return <span className={`pill ${cls}`}>{v}</span>;
}

function Empty({ icon = '📋', msg = 'No data available yet.' }) {
  return <div className="empty-state"><div className="ei">{icon}</div><div>{msg}</div></div>;
}

function Loading() { return <div className="loading">Loading…</div>; }

function useLoad(fn) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await fn()); } catch { setData(null); }
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);
  return [data, loading, load];
}

// ── role→label map ─────────────────────────────────────────────
const ROLE_LABEL = {
  candidate: 'Candidate', training_vendor: 'Training Partner', trainer: 'Trainer',
  employer: 'Employer', csr_org: 'CSR Org', placement_agency: 'Placement Agency',
  state_government: 'State Govt', central_government: 'Central Govt',
  admin: 'Admin', superadmin: 'Superadmin',
};

// ── Panels ─────────────────────────────────────────────────────

function PanelDashboard({ stats }) {
  const s = stats || {};
  const fmt = n => (n ?? 0).toLocaleString('en-IN');
  const certRate = s.candidates ? Math.round((s.totalCertificates || 0) / s.candidates * 100) : 0;
  const placeRate = s.totalCertificates ? Math.round((s.placedCandidates || 0) / s.totalCertificates * 100) : 0;

  return (
    <>
      <div className="ph"><h1>Platform Overview</h1><p>SkillsNJobs · Real-time data · Skills India aligned</p></div>
      <div className="kpi-grid">
        <div className="kpi" style={{'--c':'#003366'}}><div className="val">{fmt(s.candidates)}</div><div className="lbl">Total Learners</div><div className="sub">{s.activeBatches} active batches</div></div>
        <div className="kpi" style={{'--c':'#007B5E'}}><div className="val">{fmt(s.trainingVendors)}</div><div className="lbl">Training Partners</div><div className="sub">{fmt(s.vendorCentres)} centres</div></div>
        <div className="kpi" style={{'--c':'#7C3AED'}}><div className="val">{fmt(s.trainers)}</div><div className="lbl">Trainers & Assessors</div><div className="sub">{s.totalBatches} total batches</div></div>
        <div className="kpi" style={{'--c':'#FF6B00'}}><div className="val">{fmt(s.totalCertificates)}</div><div className="lbl">Certifications Issued</div><div className="sub">across all portals</div></div>
        <div className="kpi" style={{'--c':'#DC2626'}}><div className="val">{fmt(s.placedCandidates)}</div><div className="lbl">Placed Candidates</div><div className="sub">{fmt(s.totalPlacements)} total placements</div></div>
        <div className="kpi" style={{'--c':'#0891B2'}}><div className="val">{fmt(s.employers)}</div><div className="lbl">Employer Partners</div><div className="sub">{s.openJobs} open jobs</div></div>
      </div>
      <div className="grid2">
        <div className="card">
          <div className="card-title">📊 Platform KPIs</div>
          {[['Placement Rate', placeRate, '#007B5E'], ['Certification Rate', certRate, '#003366'], ['Dropout Rate', s.dropoutRate || 0, '#DC2626'], ['Course Completion', s.completionRate || 0, '#FF6B00']].map(([lbl, val, c]) => (
            <div key={lbl} style={{marginBottom:12}}>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:4}}>
                <span style={{fontWeight:600}}>{lbl}</span>
                <span style={{color:c,fontWeight:700}}>{val}%</span>
              </div>
              <div className="prog-bar"><div className="prog-fill" style={{width:`${val}%`,background:c}} /></div>
            </div>
          ))}
        </div>
        <div className="card">
          <div className="card-title">⚡ Quick Actions</div>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {[['➕ Add Training Partner','btn-primary'],['📥 Bulk Import Users','btn-teal'],['📊 Generate MIS Report','btn-outline'],['🔍 Verify Certificates','btn-outline']].map(([lbl,cls]) => (
              <button key={lbl} className={`sa-btn ${cls}`} style={{textAlign:'left'}}>{lbl}</button>
            ))}
          </div>
        </div>
      </div>
      {s.schemes?.length > 0 && (
        <div className="card">
          <div className="card-title">📋 Scheme-wise Enrolments</div>
          <table className="sa-table">
            <thead><tr><th>Scheme</th><th>Enrolled</th><th>Certified</th><th>Placed</th><th>Cert Rate</th></tr></thead>
            <tbody>
              {s.schemes.map(sc => (
                <tr key={sc.id}>
                  <td style={{fontWeight:700}}>{sc.name}</td>
                  <td>{sc.enrolled || 0}</td>
                  <td>{sc.certified || 0}</td>
                  <td>{sc.placed || 0}</td>
                  <td><Pill v={sc.enrolled ? `${Math.round((sc.certified||0)/sc.enrolled*100)}%` : '—'} map={{}} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function PanelUsers({ role, title }) {
  const [users, loading, reload] = useLoad(() => role ? api.usersByRole(role) : api.allUsers());
  const list = Array.isArray(users) ? users : [];
  const { user: me } = useAuth();
  const [busyId, setBusyId] = useState(null);

  async function toggleStatus(u) {
    setBusyId(u.id);
    try { await api.setUserStatus(u.id, u.is_active === 0 ? 1 : 0); reload(); }
    catch (e) { alert(e.message || 'Failed to update status'); }
    setBusyId(null);
  }
  async function removeUser(u) {
    if (!confirm(`Delete ${u.name || u.email}? This cannot be undone.`)) return;
    setBusyId(u.id);
    try { await api.deleteUser(u.id); reload(); }
    catch (e) { alert(e.message || 'Failed to delete user'); }
    setBusyId(null);
  }

  return (
    <>
      <div className="ph"><h1>{title}</h1><p>{list.length} registered users</p></div>
      <div className="kpi-grid">
        <div className="kpi" style={{'--c':'#003366'}}><div className="val">{list.length}</div><div className="lbl">Total</div></div>
        <div className="kpi" style={{'--c':'#007B5E'}}><div className="val">{list.filter(u => u.is_active !== 0).length}</div><div className="lbl">Active</div></div>
        <div className="kpi" style={{'--c':'#DC2626'}}><div className="val">{list.filter(u => u.is_active === 0).length}</div><div className="lbl">Inactive</div></div>
      </div>
      <div className="card">
        {loading ? <Loading /> : list.length === 0 ? <Empty icon="👥" msg="No users found." /> : (
          <table className="sa-table">
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Organisation</th><th>Location</th><th>Status</th><th>Joined</th><th>Action</th></tr></thead>
            <tbody>
              {list.map(u => (
                <tr key={u.id}>
                  <td style={{fontWeight:600}}>{u.name || `${u.first_name||''} ${u.last_name||''}`.trim() || '—'}</td>
                  <td style={{fontSize:'11px',color:'#6B7FA3'}}>{u.email}</td>
                  <td><span className="pill blue">{ROLE_LABEL[u.role] || u.role}</span></td>
                  <td style={{fontSize:'11px'}}>{u.org_name || '—'}</td>
                  <td>{u.location || u.city || '—'}</td>
                  <td><Pill v={u.is_active !== 0 ? 'Active' : 'Inactive'} map={{Active:'green',Inactive:'red'}} /></td>
                  <td style={{fontSize:'10.5px',color:'#94A3B8'}}>{(u.created_at||'').slice(0,10)}</td>
                  <td style={{whiteSpace:'nowrap'}}>
                    {u.id === me?.id ? <span style={{fontSize:10.5,color:'#94A3B8'}}>You</span> : <>
                      <button disabled={busyId===u.id} onClick={() => toggleStatus(u)}
                        style={{fontSize:11,padding:'3px 8px',borderRadius:5,border:'1px solid #dde2eb',background:'#fff',cursor:busyId===u.id?'default':'pointer',marginRight:6,opacity:busyId===u.id?0.6:1}}>
                        {u.is_active === 0 ? 'Activate' : 'Deactivate'}
                      </button>
                      <button disabled={busyId===u.id} onClick={() => removeUser(u)}
                        style={{fontSize:11,padding:'3px 8px',borderRadius:5,border:'1px solid #DC2626',color:'#DC2626',background:'#fff',cursor:busyId===u.id?'default':'pointer',opacity:busyId===u.id?0.6:1}}>
                        Delete
                      </button>
                    </>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

function PanelAllUsers() {
  const [users, loading, reload] = useLoad(() => api.allUsers());
  const list = Array.isArray(users) ? users : [];
  const byRole = list.reduce((acc, u) => { acc[u.role] = (acc[u.role]||0)+1; return acc; }, {});
  const { user: me } = useAuth();
  const [busyId, setBusyId] = useState(null);

  async function toggleStatus(u) {
    setBusyId(u.id);
    try { await api.setUserStatus(u.id, u.is_active === 0 ? 1 : 0); reload(); }
    catch (e) { alert(e.message || 'Failed to update status'); }
    setBusyId(null);
  }
  async function removeUser(u) {
    if (!confirm(`Delete ${u.name || u.email}? This cannot be undone.`)) return;
    setBusyId(u.id);
    try { await api.deleteUser(u.id); reload(); }
    catch (e) { alert(e.message || 'Failed to delete user'); }
    setBusyId(null);
  }

  return (
    <>
      <div className="ph"><h1>All Users</h1><p>{list.length} total platform users</p></div>
      <div className="kpi-grid">
        {Object.entries(byRole).sort(([,a],[,b])=>b-a).map(([role, cnt]) => (
          <div key={role} className="kpi" style={{'--c':'#003366'}}><div className="val">{cnt}</div><div className="lbl">{ROLE_LABEL[role]||role}</div></div>
        ))}
      </div>
      <div className="card">
        {loading ? <Loading /> : list.length === 0 ? <Empty icon="👥" /> : (
          <table className="sa-table">
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Organisation</th><th>Status</th><th>Joined</th><th>Action</th></tr></thead>
            <tbody>
              {list.map(u => (
                <tr key={u.id}>
                  <td style={{fontWeight:600}}>{u.name || `${u.first_name||''} ${u.last_name||''}`.trim() || '—'}</td>
                  <td style={{fontSize:'11px',color:'#6B7FA3'}}>{u.email}</td>
                  <td><span className="pill blue" style={{fontSize:9}}>{ROLE_LABEL[u.role]||u.role}</span></td>
                  <td style={{fontSize:'11px'}}>{u.org_name||'—'}</td>
                  <td><Pill v={u.is_active!==0?'Active':'Inactive'} map={{Active:'green',Inactive:'red'}} /></td>
                  <td style={{fontSize:'10.5px',color:'#94A3B8'}}>{(u.created_at||'').slice(0,10)}</td>
                  <td style={{whiteSpace:'nowrap'}}>
                    {u.id === me?.id ? <span style={{fontSize:10.5,color:'#94A3B8'}}>You</span> : <>
                      <button disabled={busyId===u.id} onClick={() => toggleStatus(u)}
                        style={{fontSize:11,padding:'3px 8px',borderRadius:5,border:'1px solid #dde2eb',background:'#fff',cursor:busyId===u.id?'default':'pointer',marginRight:6,opacity:busyId===u.id?0.6:1}}>
                        {u.is_active === 0 ? 'Activate' : 'Deactivate'}
                      </button>
                      <button disabled={busyId===u.id} onClick={() => removeUser(u)}
                        style={{fontSize:11,padding:'3px 8px',borderRadius:5,border:'1px solid #DC2626',color:'#DC2626',background:'#fff',cursor:busyId===u.id?'default':'pointer',opacity:busyId===u.id?0.6:1}}>
                        Delete
                      </button>
                    </>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

function PanelTrainingPartners({ subview }) {
  const [tps, loading] = useLoad(() => api.sgTPs());
  const list = Array.isArray(tps) ? tps : [];

  const filtered = subview === 'tp-verify'
    ? list.filter(t => t.status === 'pending')
    : subview === 'tp-accred'
    ? list.filter(t => t.accreditation)
    : list;

  const titles = { 'tp-list': 'Partner Registry', 'tp-verify': 'Verification Queue', 'tp-accred': 'Accreditation Status', 'tp-perf': 'Performance Dashboard' };

  return (
    <>
      <div className="ph"><h1>{titles[subview]||'Training Partners'}</h1><p>{filtered.length} partners</p></div>
      <div className="kpi-grid">
        <div className="kpi" style={{'--c':'#003366'}}><div className="val">{list.length}</div><div className="lbl">Total TPs</div></div>
        <div className="kpi" style={{'--c':'#007B5E'}}><div className="val">{list.filter(t=>t.status==='verified').length}</div><div className="lbl">Verified</div></div>
        <div className="kpi" style={{'--c':'#FF6B00'}}><div className="val">{list.filter(t=>t.status==='pending').length}</div><div className="lbl">Pending</div></div>
        <div className="kpi" style={{'--c':'#DC2626'}}><div className="val">{list.filter(t=>t.status==='suspended').length}</div><div className="lbl">Suspended</div></div>
      </div>
      <div className="card">
        {loading ? <Loading /> : filtered.length === 0 ? <Empty icon="🏫" msg="No training partners found." /> : (
          <table className="sa-table">
            <thead><tr><th>Name</th><th>Type</th><th>District</th><th>State</th><th>Scheme</th><th>Accreditation</th><th>Status</th></tr></thead>
            <tbody>
              {filtered.map(tp => (
                <tr key={tp.id}>
                  <td style={{fontWeight:600}}>{tp.name}</td>
                  <td style={{fontSize:'11px'}}>{tp.type||'—'}</td>
                  <td>{tp.district||'—'}</td>
                  <td>{tp.state_name||'—'}</td>
                  <td>{tp.scheme ? <span className="pill blue" style={{fontSize:9}}>{tp.scheme}</span> : '—'}</td>
                  <td style={{fontSize:'11px'}}>{tp.accreditation||'—'}</td>
                  <td><Pill v={tp.status||'pending'} map={{verified:'green',pending:'amber',suspended:'red',blacklisted:'red'}} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

function PanelCentres({ subview }) {
  const [tps, loading] = useLoad(() => api.sgTPs());
  const list = Array.isArray(tps) ? tps : [];
  const titles = { 'centers-list': 'Center Registry', 'centers-audit': 'Infrastructure Audit', 'centers-geo': 'Geo-Mapping' };
  const totalCentres = list.reduce((s,t)=>s+(t.centre_count||0),0);
  const districts = [...new Set(list.map(t=>t.district).filter(Boolean))];

  return (
    <>
      <div className="ph"><h1>{titles[subview]||'Training Centers'}</h1><p>Aggregated from training partner records</p></div>
      <div className="kpi-grid">
        <div className="kpi" style={{'--c':'#003366'}}><div className="val">{totalCentres}</div><div className="lbl">Total Centres</div></div>
        <div className="kpi" style={{'--c':'#007B5E'}}><div className="val">{list.filter(t=>t.status==='verified').reduce((s,t)=>s+(t.centre_count||0),0)}</div><div className="lbl">Active Centres</div></div>
        <div className="kpi" style={{'--c':'#FF6B00'}}><div className="val">{districts.length}</div><div className="lbl">Districts Covered</div></div>
      </div>
      <div className="card">
        {loading ? <Loading /> : list.length === 0 ? <Empty icon="📍" msg="No training partner data yet." /> : (
          <table className="sa-table">
            <thead><tr><th>Training Partner</th><th>District</th><th>State</th><th>Scheme</th><th>Centres</th><th>Status</th></tr></thead>
            <tbody>
              {list.map(tp => (
                <tr key={tp.id}>
                  <td style={{fontWeight:600}}>{tp.name}</td>
                  <td>{tp.district||'—'}</td>
                  <td>{tp.state_name||'—'}</td>
                  <td>{tp.scheme ? <span className="pill blue" style={{fontSize:9}}>{tp.scheme}</span> : '—'}</td>
                  <td style={{fontWeight:700,color:'#003366'}}>{tp.centre_count||0}</td>
                  <td><Pill v={tp.status||'pending'} map={{verified:'green',pending:'amber',suspended:'red'}} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

function PanelTrainers({ subview }) {
  const [trainers, loading] = useLoad(() => api.usersByRole('trainer'));
  const list = Array.isArray(trainers) ? trainers : [];
  const titles = { 'tr-list': 'Trainer Registry', 'tr-assess': 'Assessor Registry', 'tr-certs': 'Certifications & Badges' };

  return (
    <>
      <div className="ph"><h1>{titles[subview]||'Trainers & Assessors'}</h1><p>{list.length} trainers registered on platform</p></div>
      <div className="kpi-grid">
        <div className="kpi" style={{'--c':'#003366'}}><div className="val">{list.length}</div><div className="lbl">Total Trainers</div></div>
        <div className="kpi" style={{'--c':'#007B5E'}}><div className="val">{list.filter(u=>u.is_active!==0).length}</div><div className="lbl">Active</div></div>
        <div className="kpi" style={{'--c':'#DC2626'}}><div className="val">{list.filter(u=>u.is_active===0).length}</div><div className="lbl">Inactive</div></div>
      </div>
      <div className="card">
        {loading ? <Loading /> : list.length === 0 ? <Empty icon="👨‍🏫" msg="No trainers registered yet." /> : (
          <table className="sa-table">
            <thead><tr><th>Name</th><th>Email</th><th>Organisation</th><th>Location</th><th>Status</th><th>Joined</th></tr></thead>
            <tbody>
              {list.map(u => (
                <tr key={u.id}>
                  <td style={{fontWeight:600}}>{u.name||'—'}</td>
                  <td style={{fontSize:'11px',color:'#6B7FA3'}}>{u.email}</td>
                  <td style={{fontSize:'11px'}}>{u.org_name||'—'}</td>
                  <td>{u.location||'—'}</td>
                  <td><Pill v={u.is_active!==0?'Active':'Inactive'} map={{Active:'green',Inactive:'red'}} /></td>
                  <td style={{fontSize:'10.5px',color:'#94A3B8'}}>{(u.created_at||'').slice(0,10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

function PanelCourses({ subview }) {
  const [courses, loading] = useLoad(() => api.courses());
  const list = Array.isArray(courses) ? courses : [];
  const titles = { 'course-catalogue': 'Course Catalogue', 'course-nsqf': 'NSQF Framework', 'course-approve': 'Approval Queue', 'course-upload': 'Curriculum Upload' };

  return (
    <>
      <div className="ph"><h1>{titles[subview]||'Courses'}</h1><p>{list.length} courses on platform</p></div>
      <div className="kpi-grid">
        <div className="kpi" style={{'--c':'#003366'}}><div className="val">{list.length}</div><div className="lbl">Total Courses</div></div>
        <div className="kpi" style={{'--c':'#007B5E'}}><div className="val">{[...new Set(list.map(c=>c.sector).filter(Boolean))].length}</div><div className="lbl">Sectors</div></div>
        <div className="kpi" style={{'--c':'#FF6B00'}}><div className="val">{[...new Set(list.map(c=>c.provider_id||c.created_by).filter(Boolean))].length}</div><div className="lbl">Providers</div></div>
      </div>
      <div className="card">
        {loading ? <Loading /> : list.length === 0 ? <Empty icon="📚" msg="No courses yet." /> : (
          <table className="sa-table">
            <thead><tr><th>Title</th><th>Sector</th><th>Duration</th><th>NSQF Level</th><th>Provider</th><th>Fee</th></tr></thead>
            <tbody>
              {list.map(c => (
                <tr key={c.id}>
                  <td style={{fontWeight:600}}>{c.title}</td>
                  <td>{c.sector||'—'}</td>
                  <td>{c.duration_weeks ? `${c.duration_weeks}w` : c.duration||'—'}</td>
                  <td>{c.nsqf_level ? <span className="pill purple">Level {c.nsqf_level}</span> : '—'}</td>
                  <td style={{fontSize:'11px'}}>{c.provider_name||c.org_name||'—'}</td>
                  <td>{c.fee != null ? (c.fee===0 ? <span className="pill green">Free</span> : `₹${Number(c.fee).toLocaleString()}`) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

function PanelCandidates() {
  const [users, loading] = useLoad(() => api.usersByRole('candidate'));
  const list = Array.isArray(users) ? users : [];

  return (
    <>
      <div className="ph"><h1>Candidate Registry</h1><p>{list.length} registered candidates</p></div>
      <div className="kpi-grid">
        <div className="kpi" style={{'--c':'#003366'}}><div className="val">{list.length}</div><div className="lbl">Total</div></div>
        <div className="kpi" style={{'--c':'#007B5E'}}><div className="val">{list.filter(u=>u.is_active!==0).length}</div><div className="lbl">Active</div></div>
        <div className="kpi" style={{'--c':'#FF6B00'}}><div className="val">{list.filter(u=>u.gender==='M').length}</div><div className="lbl">Male</div></div>
        <div className="kpi" style={{'--c':'#7C3AED'}}><div className="val">{list.filter(u=>u.gender==='F').length}</div><div className="lbl">Female</div></div>
      </div>
      <div className="card">
        {loading ? <Loading /> : list.length === 0 ? <Empty icon="👤" msg="No candidates yet." /> : (
          <table className="sa-table">
            <thead><tr><th>Name</th><th>Email</th><th>Location</th><th>Skills</th><th>Status</th><th>Joined</th></tr></thead>
            <tbody>
              {list.map(u => {
                const skills = (() => { try { return JSON.parse(u.skills||'[]'); } catch { return []; } })();
                return (
                  <tr key={u.id}>
                    <td style={{fontWeight:600}}>{u.name||`${u.first_name||''} ${u.last_name||''}`.trim()||'—'}</td>
                    <td style={{fontSize:'11px',color:'#6B7FA3'}}>{u.email}</td>
                    <td>{u.location||u.city||'—'}</td>
                    <td style={{fontSize:'10.5px'}}>{skills.slice(0,3).join(', ')||'—'}</td>
                    <td><Pill v={u.is_active!==0?'Active':'Inactive'} map={{Active:'green',Inactive:'red'}} /></td>
                    <td style={{fontSize:'10.5px',color:'#94A3B8'}}>{(u.created_at||'').slice(0,10)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

function PanelEnrolments() {
  const [data, loading] = useLoad(() => api.allEnrolments());
  const [tab, setTab] = React.useState('all');
  if (loading) return <Loading />;
  const d = data || {};
  const totals = d.totals || {};
  const all = [...(d.self||[]), ...(d.trainer||[]), ...(d.vendor||[]), ...(d.state||[])].sort((a,b) => new Date(b.enroll_date||0) - new Date(a.enroll_date||0));
  const rows = tab === 'all' ? all : (d[tab] || []);
  const sourceColor = { self:'#DBEAFE', trainer:'#D1FAE5', vendor:'#EDE9FE', state:'#FEF3C7' };
  const sourceText  = { self:'#1D4ED8', trainer:'#15803D', vendor:'#6D28D9', state:'#92400E' };
  const sourceLabel = { self:'Self', trainer:'Trainer', vendor:'Vendor', state:'State Govt' };
  return (
    <>
      <div className="ph"><h1>Enrolments</h1><p>Unified view across all portals — {all.length} total enrolments</p></div>
      <div className="kpi-grid">
        <div className="kpi" style={{'--c':'#1D4ED8'}}><div className="val">{totals.self||0}</div><div className="lbl">Self-Enrolled</div><div className="sub">Candidate Portal</div></div>
        <div className="kpi" style={{'--c':'#15803D'}}><div className="val">{totals.trainer||0}</div><div className="lbl">Batch Enrolled</div><div className="sub">Trainer Portal</div></div>
        <div className="kpi" style={{'--c':'#6D28D9'}}><div className="val">{totals.vendor||0}</div><div className="lbl">Vendor Enrolled</div><div className="sub">Vendor Portal</div></div>
        <div className="kpi" style={{'--c':'#D97706'}}><div className="val">{totals.state||0}</div><div className="lbl">State Beneficiaries</div><div className="sub">State Govt Portal</div></div>
      </div>
      <div className="card">
        <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap' }}>
          {['all','self','trainer','vendor','state'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding:'5px 14px', borderRadius:20, border:'none', cursor:'pointer', fontWeight:600, fontSize:12,
              background: tab===t ? '#0B1E3D' : '#F1F5F9', color: tab===t ? '#fff' : '#374151' }}>
              {t==='all' ? `All (${all.length})` : `${sourceLabel[t]} (${totals[t]||0})`}
            </button>
          ))}
        </div>
        {rows.length === 0 ? <Empty icon="📋" msg="No enrolments found." /> : (
          <table className="sa-table">
            <thead><tr><th>Source</th><th>Candidate</th><th>Contact</th><th>Course</th><th>Batch</th><th>Scheme</th><th>District/State</th><th>Status</th><th>Enrol Date</th></tr></thead>
            <tbody>
              {rows.slice(0,200).map((r,i) => (
                <tr key={i}>
                  <td><span style={{ fontSize:10, padding:'2px 7px', borderRadius:10, background:sourceColor[r.source]||'#F1F5F9', color:sourceText[r.source]||'#374151', fontWeight:700 }}>{sourceLabel[r.source]||r.source}</span></td>
                  <td style={{ fontWeight:600, fontSize:'11px' }}>{r.candidate_name||'—'}</td>
                  <td style={{ fontSize:'10.5px', color:'#6B7FA3' }}>{r.candidate_email||r.candidate_mobile||'—'}</td>
                  <td style={{ fontSize:'11px' }}>{r.course_title||'—'}</td>
                  <td style={{ fontSize:'10.5px' }}>{r.batch_code||'—'}</td>
                  <td style={{ fontSize:'10.5px' }}>{r.scheme||'—'}</td>
                  <td style={{ fontSize:'10.5px', color:'#6B7FA3' }}>{[r.district,r.state_name].filter(Boolean).join(', ')||'—'}</td>
                  <td><Pill v={r.status||'enrolled'} map={{enrolled:'blue','in-training':'blue',assessed:'amber',certified:'green',placed:'green',completed:'green',dropped:'red',withdrawn:'red'}} /></td>
                  <td style={{ fontSize:'10.5px', color:'#6B7FA3' }}>{r.enroll_date ? String(r.enroll_date).slice(0,10) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

function PanelBatches() {
  const [batches, loading] = useLoad(() => api.allBatches ? api.allBatches() : fetch('/api/batches', {headers:{Authorization:`Bearer ${localStorage.getItem('snj_token')}`}}).then(r=>r.json()));
  const list = Array.isArray(batches) ? batches : [];

  return (
    <>
      <div className="ph"><h1>Batch Management</h1><p>{list.length} batches across all training partners</p></div>
      <div className="kpi-grid">
        <div className="kpi" style={{'--c':'#003366'}}><div className="val">{list.length}</div><div className="lbl">Total Batches</div></div>
        <div className="kpi" style={{'--c':'#007B5E'}}><div className="val">{list.filter(b=>b.status==='active'||b.status==='ongoing').length}</div><div className="lbl">Active</div></div>
        <div className="kpi" style={{'--c':'#FF6B00'}}><div className="val">{list.filter(b=>b.status==='completed').length}</div><div className="lbl">Completed</div></div>
        <div className="kpi" style={{'--c':'#6B7FA3'}}><div className="val">{list.filter(b=>b.status==='upcoming'||b.status==='planned').length}</div><div className="lbl">Upcoming</div></div>
      </div>
      <div className="card">
        {loading ? <Loading /> : list.length === 0 ? <Empty icon="📅" msg="No batches found." /> : (
          <table className="sa-table">
            <thead><tr><th>Batch Code</th><th>Course</th><th>Centre</th><th>Trainer / Vendor</th><th>Source</th><th>Start</th><th>End</th><th>Enrolled</th><th>Status</th></tr></thead>
            <tbody>
              {list.map(b => (
                <tr key={b.id}>
                  <td style={{fontWeight:700,fontSize:'10.5px'}}>{b.batch_code||`#${b.id}`}</td>
                  <td style={{fontSize:'11px'}}>{b.course_title||'—'}</td>
                  <td style={{fontSize:'11px'}}>{b.centre_name||'—'}</td>
                  <td style={{fontSize:'11px'}}>{b.source==='vendor' ? (b.vendor_trainer_name||b.vendor_name||'—') : (b.trainer_name||'—')}</td>
                  <td><span style={{fontSize:10,padding:'2px 6px',borderRadius:10,background:b.source==='vendor'?'#EDE9FE':'#DBEAFE',color:b.source==='vendor'?'#6D28D9':'#1D4ED8',fontWeight:600}}>{b.source==='vendor'?'Vendor':'Trainer'}</span></td>
                  <td style={{fontSize:'10.5px',color:'#6B7FA3'}}>{b.start_date||'—'}</td>
                  <td style={{fontSize:'10.5px',color:'#6B7FA3'}}>{b.end_date||'—'}</td>
                  <td style={{fontWeight:700}}>{b.enrolled??b.learner_count??'—'}</td>
                  <td><Pill v={b.status||'upcoming'} map={{active:'blue',completed:'green',upcoming:'amber',cancelled:'red'}} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

function PanelJobs() {
  const [jobs, loading] = useLoad(() => api.jobs());
  const list = Array.isArray(jobs) ? jobs : [];

  return (
    <>
      <div className="ph"><h1>Job Marketplace</h1><p>{list.length} total job postings</p></div>
      <div className="kpi-grid">
        <div className="kpi" style={{'--c':'#003366'}}><div className="val">{list.length}</div><div className="lbl">Total Jobs</div></div>
        <div className="kpi" style={{'--c':'#007B5E'}}><div className="val">{list.filter(j=>j.status==='open').length}</div><div className="lbl">Open</div></div>
        <div className="kpi" style={{'--c':'#6B7FA3'}}><div className="val">{list.filter(j=>j.status==='draft').length}</div><div className="lbl">Draft</div></div>
        <div className="kpi" style={{'--c':'#DC2626'}}><div className="val">{list.filter(j=>j.status==='closed').length}</div><div className="lbl">Closed</div></div>
      </div>
      <div className="card">
        {loading ? <Loading /> : list.length === 0 ? <Empty icon="💼" msg="No job postings yet." /> : (
          <table className="sa-table">
            <thead><tr><th>Title</th><th>Employer</th><th>Location</th><th>Type</th><th>Salary Range</th><th>Status</th><th>Posted</th></tr></thead>
            <tbody>
              {list.map(j => (
                <tr key={j.id}>
                  <td style={{fontWeight:600}}>{j.title}</td>
                  <td style={{fontSize:'11px'}}>{j.employer_name||'—'}</td>
                  <td>{j.location||'—'}</td>
                  <td style={{fontSize:'10.5px'}}>{j.job_type||'—'}</td>
                  <td style={{fontSize:'10.5px'}}>{j.salary_min && j.salary_max ? `₹${Number(j.salary_min).toLocaleString()} – ₹${Number(j.salary_max).toLocaleString()}` : '—'}</td>
                  <td><Pill v={j.status||'open'} map={{open:'green',draft:'gray',closed:'red'}} /></td>
                  <td style={{fontSize:'10.5px',color:'#94A3B8'}}>{(j.created_at||'').slice(0,10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

function PanelPlacements() {
  const [data, loading] = useLoad(() => api.allPlacements ? api.allPlacements() : fetch('/api/placements/mine', {headers:{Authorization:`Bearer ${localStorage.getItem('snj_token')}`}}).then(r=>r.json()));
  const list = Array.isArray(data) ? data : (data?.placements||[]);

  return (
    <>
      <div className="ph"><h1>Placement Records</h1><p>{list.length} placement records</p></div>
      <div className="kpi-grid">
        <div className="kpi" style={{'--c':'#007B5E'}}><div className="val">{list.length}</div><div className="lbl">Total Placements</div></div>
        <div className="kpi" style={{'--c':'#003366'}}><div className="val">{[...new Set(list.map(p=>p.employer_name||p.company).filter(Boolean))].length}</div><div className="lbl">Unique Employers</div></div>
        <div className="kpi" style={{'--c':'#FF6B00'}}><div className="val">{list.length ? `₹${Math.round(list.reduce((s,p)=>s+(p.salary||p.ctc||0),0)/list.length).toLocaleString()}/yr` : '—'}</div><div className="lbl">Avg Salary</div></div>
      </div>
      <div className="card">
        {loading ? <Loading /> : list.length === 0 ? <Empty icon="🎯" msg="No placement records yet." /> : (
          <table className="sa-table">
            <thead><tr><th>Candidate</th><th>Role</th><th>Employer</th><th>Salary</th><th>Date</th><th>Status</th></tr></thead>
            <tbody>
              {list.map((p,i) => (
                <tr key={p.id||i}>
                  <td style={{fontWeight:600}}>{p.candidate_name||p.name||'—'}</td>
                  <td style={{fontSize:'11px'}}>{p.job_title||p.role||'—'}</td>
                  <td style={{fontSize:'11px'}}>{p.employer_name||p.company||'—'}</td>
                  <td style={{fontWeight:700,color:'#007B5E'}}>{p.salary||p.ctc ? `₹${Number(p.salary||p.ctc).toLocaleString()}/yr` : '—'}</td>
                  <td style={{fontSize:'10.5px',color:'#6B7FA3'}}>{(p.placed_date||p.created_at||'').slice(0,10)}</td>
                  <td><Pill v={p.status||'placed'} map={{placed:'green',confirmed:'green',pending:'amber'}} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

function PanelAuditLogs() {
  const [logs, loading] = useLoad(() => api.auditLogs({ limit: 100 }));
  const list = Array.isArray(logs) ? logs : (logs?.rows||[]);

  const exportCSV = () => {
    const hdr = 'Timestamp,User,Action,Entity,IP\n';
    const body = list.map(l => `"${l.created_at}","${l.user_name||l.user||''}","${l.action}","${l.entity||''}","${l.ip||''}"`).join('\n');
    const url = URL.createObjectURL(new Blob([hdr+body],{type:'text/csv'}));
    Object.assign(document.createElement('a'),{href:url,download:'audit-logs.csv'}).click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="ph"><h1>Audit Logs</h1><p>Complete platform activity trail</p></div>
      <div className="card">
        <div className="card-hdr">
          <div className="card-title" style={{margin:0}}>Activity Log ({list.length} entries)</div>
          {list.length > 0 && <button className="sa-btn btn-outline" onClick={exportCSV}>📥 Export CSV</button>}
        </div>
        {loading ? <Loading /> : list.length === 0 ? <Empty icon="🔍" msg="No audit log entries yet." /> : (
          <table className="sa-table">
            <thead><tr><th>Timestamp</th><th>User</th><th>Action</th><th>Entity</th><th>IP</th></tr></thead>
            <tbody>
              {list.map((l,i) => (
                <tr key={i}>
                  <td style={{fontSize:'10.5px',color:'#6B7FA3',whiteSpace:'nowrap'}}>{(l.created_at||'').replace('T',' ').slice(0,16)}</td>
                  <td style={{fontWeight:600,fontSize:'11px'}}>{l.user_name||l.user||'—'}</td>
                  <td style={{fontSize:'11.5px'}}>{l.action}</td>
                  <td style={{fontSize:'11px',color:'#3D5170'}}>{l.entity}{l.entity_id?` #${l.entity_id}`:''}{l.detail?` — ${l.detail}`:''}</td>
                  <td style={{fontSize:'10.5px',color:'#94A3B8'}}>{l.ip||'—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

function PanelGeoStates() {
  const [geo, loading] = useLoad(() => api.geographicCoverage());
  const list = Array.isArray(geo) ? geo : [];
  return (
    <>
      <div className="ph"><h1>States & Districts</h1><p>Geographic coverage configuration</p></div>
      <div className="kpi-grid">
        <div className="kpi" style={{'--c':'#003366'}}><div className="val">{list.length}</div><div className="lbl">Regions Configured</div></div>
        <div className="kpi" style={{'--c':'#007B5E'}}><div className="val">{list.filter(g=>g.is_enabled).length}</div><div className="lbl">Active</div></div>
        <div className="kpi" style={{'--c':'#DC2626'}}><div className="val">{list.filter(g=>!g.is_enabled).length}</div><div className="lbl">Disabled</div></div>
      </div>
      <div className="card">
        {loading ? <Loading /> : list.length === 0 ? <Empty icon="🗺️" msg="No geographic data configured." /> : (
          <table className="sa-table">
            <thead><tr><th>Region / State</th><th>Status</th><th>Added</th></tr></thead>
            <tbody>
              {list.map(g => (
                <tr key={g.id}>
                  <td style={{fontWeight:600}}>{g.name}</td>
                  <td><Pill v={g.is_enabled?'Active':'Disabled'} map={{Active:'green',Disabled:'red'}} /></td>
                  <td style={{fontSize:'10.5px',color:'#94A3B8'}}>{(g.created_at||'').slice(0,10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

function PanelAccreditations() {
  const [data, loading] = useLoad(() => api.accreditations());
  const list = Array.isArray(data) ? data : [];
  return (
    <>
      <div className="ph"><h1>Accreditation Types</h1><p>Configured accreditation types for training partners</p></div>
      <div className="kpi-grid">
        <div className="kpi" style={{'--c':'#003366'}}><div className="val">{list.length}</div><div className="lbl">Total Types</div></div>
        <div className="kpi" style={{'--c':'#007B5E'}}><div className="val">{list.filter(a=>a.is_enabled).length}</div><div className="lbl">Active</div></div>
      </div>
      <div className="card">
        {loading ? <Loading /> : list.length === 0 ? <Empty icon="🏅" msg="No accreditation types configured yet." /> : (
          <table className="sa-table">
            <thead><tr><th>Accreditation Type</th><th>Status</th><th>Added</th></tr></thead>
            <tbody>
              {list.map(a => (
                <tr key={a.id}>
                  <td style={{fontWeight:600}}>{a.name}</td>
                  <td><Pill v={a.is_enabled?'Active':'Disabled'} map={{Active:'green',Disabled:'red'}} /></td>
                  <td style={{fontSize:'10.5px',color:'#94A3B8'}}>{(a.created_at||'').slice(0,10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

function PanelOrgClassifications() {
  const [data, loading] = useLoad(() => api.orgClassifications());
  const list = Array.isArray(data) ? data : [];
  return (
    <>
      <div className="ph"><h1>Organisation Classifications</h1><p>Organisation category types for the platform</p></div>
      <div className="card">
        {loading ? <Loading /> : list.length === 0 ? <Empty icon="🏢" msg="No classifications configured yet." /> : (
          <table className="sa-table">
            <thead><tr><th>Classification</th><th>Status</th><th>Added</th></tr></thead>
            <tbody>
              {list.map(o => (
                <tr key={o.id}>
                  <td style={{fontWeight:600}}>{o.name}</td>
                  <td><Pill v={o.is_enabled?'Active':'Disabled'} map={{Active:'green',Disabled:'red'}} /></td>
                  <td style={{fontSize:'10.5px',color:'#94A3B8'}}>{(o.created_at||'').slice(0,10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

function PanelTargetBeneficiaries() {
  const [data, loading] = useLoad(() => api.targetBeneficiaries());
  const list = Array.isArray(data) ? data : [];
  return (
    <>
      <div className="ph"><h1>Target Beneficiaries</h1><p>Configured target beneficiary categories</p></div>
      <div className="kpi-grid">
        <div className="kpi" style={{'--c':'#003366'}}><div className="val">{list.length}</div><div className="lbl">Categories</div></div>
        <div className="kpi" style={{'--c':'#007B5E'}}><div className="val">{list.filter(t=>t.is_enabled).length}</div><div className="lbl">Active</div></div>
      </div>
      <div className="card">
        {loading ? <Loading /> : list.length === 0 ? <Empty icon="🎯" msg="No beneficiary categories configured yet." /> : (
          <table className="sa-table">
            <thead><tr><th>Category</th><th>Status</th><th>Added</th></tr></thead>
            <tbody>
              {list.map(t => (
                <tr key={t.id}>
                  <td style={{fontWeight:600}}>{t.name}</td>
                  <td><Pill v={t.is_enabled?'Active':'Disabled'} map={{Active:'green',Disabled:'red'}} /></td>
                  <td style={{fontSize:'10.5px',color:'#94A3B8'}}>{(t.created_at||'').slice(0,10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

function PanelNotifications({ stats }) {
  const unread = stats?.notifUnread || 0;
  return (
    <>
      <div className="ph"><h1>Notifications</h1><p>Platform-wide alerts and system notifications</p></div>
      <div className="kpi-grid">
        <div className="kpi" style={{'--c':'#DC2626'}}><div className="val">{unread}</div><div className="lbl">Unread</div></div>
      </div>
      <div className="card">
        <Empty icon="🔔" msg="Notification management will be available once the notifications backend is connected." />
      </div>
    </>
  );
}

function PanelAnalytics({ stats }) {
  const s = stats || {};
  const certRate = s.candidates ? Math.round((s.totalCertificates||0)/s.candidates*100) : 0;
  const placeRate = s.totalCertificates ? Math.round((s.placedCandidates||0)/s.totalCertificates*100) : 0;
  return (
    <>
      <div className="ph"><h1>Live Analytics</h1><p>Real-time platform performance metrics</p></div>
      <div className="kpi-grid">
        {[['Total Learners',s.candidates,'#003366'],['Training Partners',s.trainingVendors,'#007B5E'],['Certifications',s.totalCertificates,'#FF6B00'],['Placements',s.placedCandidates,'#DC2626'],['Open Jobs',s.openJobs,'#0891B2'],['Employers',s.employers,'#7C3AED']].map(([lbl,val,c]) => (
          <div key={lbl} className="kpi" style={{'--c':c}}><div className="val">{(val||0).toLocaleString()}</div><div className="lbl">{lbl}</div></div>
        ))}
      </div>
      <div className="card">
        <div className="card-title">📈 Key Performance Indicators</div>
        {[['Certification Rate',certRate,'#003366'],['Placement Rate',placeRate,'#007B5E'],['Course Completion',s.completionRate||0,'#FF6B00']].map(([lbl,val,c]) => (
          <div key={lbl} style={{marginBottom:14}}>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:4}}>
              <span style={{fontWeight:600}}>{lbl}</span>
              <span style={{color:c,fontWeight:700}}>{val}%</span>
            </div>
            <div className="prog-bar"><div className="prog-fill" style={{width:`${val}%`,background:c}} /></div>
          </div>
        ))}
      </div>
    </>
  );
}

// ── Role-menu registry (mirrors actual portal NAV arrays) ──────
const ROLE_MENUS = {
  training_vendor: {
    label: 'Training Partner', icon: '🏫', color: '#007B5E',
    sections: [
      { name: 'Main', items: [
        { key: 'dashboard', label: 'Dashboard', locked: true },
        { key: 'org-profile', label: 'Organisation Profile', locked: true },
      ]},
      { name: 'Training', items: [
        { key: 'centres', label: 'Training Centres' },
        { key: 'trainers', label: 'Trainers & Faculty' },
        { key: 'courses', label: 'Courses & Curriculum' },
        { key: 'batches', label: 'Batch Management' },
      ]},
      { name: 'Candidates', items: [
        { key: 'candidates', label: 'Candidate Management' },
      ]},
      { name: 'Assessment', items: [
        { key: 'assess', label: 'Assessments' },
      ]},
      { name: 'Collaboration', items: [
        { key: 'collab-consortium', label: 'Consortium Builder' },
        { key: 'collab-partnership', label: 'Partnership Requests' },
        { key: 'collab-resources', label: 'Resource Sharing' },
        { key: 'collab-invitations', label: 'Invitations' },
      ]},
      { name: 'Compliance', items: [
        { key: 'reports', label: 'Reports & MIS' },
        { key: 'docs', label: 'Documents' },
        { key: 'grievance', label: 'Grievance & Support' },
      ]},
      { name: 'Account', items: [
        { key: 'onboarding', label: 'Complete Profile' },
        { key: 'settings', label: 'Account Preferences' },
      ]},
    ],
  },
  trainer: {
    label: 'Trainer', icon: '👨‍🏫', color: '#7C3AED',
    sections: [
      { name: 'Main', items: [
        { key: 'dashboard', label: 'Dashboard', locked: true },
        { key: 'notifications', label: 'Notifications' },
      ]},
      { name: 'My Profile', items: [
        { key: 'profile', label: 'My Profile' },
      ]},
      { name: 'Training Management', items: [
        { key: 'batch', label: 'Batch Management' },
        { key: 'sessions', label: 'Session Management' },
        { key: 'attendance', label: 'Attendance' },
      ]},
      { name: 'Learners', items: [
        { key: 'learners', label: 'My Learners' },
      ]},
      { name: 'Assessments', items: [
        { key: 'assessments', label: 'Assessments' },
      ]},
      { name: 'Content & Resources', items: [
        { key: 'content', label: 'Course Content' },
      ]},
      { name: 'Certificates', items: [
        { key: 'certificates', label: 'Certificates' },
      ]},
      { name: 'Reports & Analytics', items: [
        { key: 'reports', label: 'Reports' },
      ]},
      { name: 'Schemes', items: [
        { key: 'schemes', label: 'Govt Schemes' },
      ]},
      { name: 'Support', items: [
        { key: 'helpdesk', label: 'Help & Support' },
        { key: 'grievance', label: 'Grievance' },
        { key: 'faq', label: 'FAQ' },
      ]},
    ],
  },
  candidate: {
    label: 'Candidate', icon: '👤', color: '#0891B2',
    sections: [
      { name: 'Main', items: [
        { key: 'dashboard', label: 'Dashboard', locked: true },
        { key: 'notifications', label: 'Notifications' },
      ]},
      { name: 'My Profile', items: [
        { key: 'profile', label: 'My Profile' },
        { key: 'skill-passport', label: 'Skill Passport' },
      ]},
      { name: 'Courses & Learning', items: [
        { key: 'courses', label: 'Courses' },
        { key: 'assessments', label: 'Assessments' },
        { key: 'certificates', label: 'Certificates' },
      ]},
      { name: 'Jobs & Employment', items: [
        { key: 'jobs', label: 'Jobs' },
        { key: 'apprenticeship', label: 'Apprenticeship' },
        { key: 'career', label: 'Career Services' },
      ]},
      { name: 'Schemes & Benefits', items: [
        { key: 'schemes', label: 'Govt Schemes' },
        { key: 'financial-aid', label: 'Financial Assistance' },
      ]},
      { name: 'Support', items: [
        { key: 'helpdesk', label: 'Help & Support' },
        { key: 'grievance', label: 'Grievance' },
        { key: 'faq', label: 'FAQ' },
      ]},
    ],
  },
  employer: {
    label: 'Employer', icon: '🏢', color: '#FF6B00',
    sections: [
      { name: 'Main', items: [
        { key: 'dashboard', label: 'Dashboard', locked: true },
        { key: 'notifications', label: 'Notifications' },
      ]},
      { name: 'Company Profile', items: [
        { key: 'profile-info', label: 'Company Information', locked: true },
        { key: 'profile-contact', label: 'Contact & Address' },
        { key: 'profile-docs', label: 'Company Documents' },
        { key: 'profile-bank', label: 'Bank & Billing' },
        { key: 'profile-hr', label: 'HR Contacts' },
      ]},
      { name: 'Job Management', items: [
        { key: 'job-post', label: 'Post New Job' },
        { key: 'job-active', label: 'Active Jobs' },
        { key: 'job-draft', label: 'Draft Jobs' },
        { key: 'job-closed', label: 'Closed Jobs' },
        { key: 'job-applications', label: 'All Applications' },
      ]},
      { name: 'Candidates', items: [
        { key: 'cand-search', label: 'Search Candidates' },
        { key: 'cand-shortlist', label: 'Shortlisted' },
        { key: 'cand-interview', label: 'Interviews' },
        { key: 'cand-offer', label: 'Offers & Onboarding' },
        { key: 'cand-placed', label: 'Placement Records' },
      ]},
      { name: 'Apprenticeship', items: [
        { key: 'appren-register', label: 'Register Vacancy' },
        { key: 'appren-active', label: 'Active Apprentices' },
        { key: 'appren-stipend', label: 'Stipend Management' },
        { key: 'appren-reports', label: 'Apprenticeship Reports' },
      ]},
      { name: 'Skill Development', items: [
        { key: 'skill-gap', label: 'Skill Gap Analysis' },
        { key: 'skill-partners', label: 'Training Partner Connect' },
        { key: 'skill-requirements', label: 'Training Requirements' },
        { key: 'skill-pmkvy', label: 'PMKVY Partnership' },
      ]},
      { name: 'Schemes', items: [
        { key: 'scheme-pmkvy', label: 'PMKVY' },
        { key: 'scheme-naps', label: 'NAPS / NATS' },
        { key: 'scheme-ddugky', label: 'DDU-GKY' },
        { key: 'scheme-star', label: 'STAR Scheme' },
        { key: 'scheme-incentives', label: 'Employer Incentives' },
      ]},
      { name: 'Reports', items: [
        { key: 'rep-hiring', label: 'Hiring Reports' },
        { key: 'rep-placement', label: 'Placement Analytics' },
        { key: 'rep-workforce', label: 'Workforce Reports' },
      ]},
      { name: 'Compliance', items: [
        { key: 'comp-labour', label: 'Labour Law' },
        { key: 'comp-pfesi', label: 'PF / ESI' },
        { key: 'comp-contract', label: 'Contract Labour' },
        { key: 'comp-audit', label: 'Audit Trail' },
      ]},
      { name: 'Support', items: [
        { key: 'helpdesk', label: 'Helpdesk' },
        { key: 'grievance', label: 'Grievance' },
        { key: 'faq', label: 'FAQ' },
      ]},
    ],
  },
  csr_org: {
    label: 'CSR Organisation', icon: '🤝', color: '#059669',
    sections: [
      { name: 'Main', items: [
        { key: 'dashboard', label: 'Dashboard', locked: true },
        { key: 'notifications', label: 'Notifications' },
      ]},
      { name: 'CSR Profile', items: [
        { key: 'profile-info', label: 'Organisation Information', locked: true },
        { key: 'profile-contact', label: 'Contact & Address' },
        { key: 'profile-docs', label: 'CSR Policy & Documents' },
        { key: 'profile-bank', label: 'Bank & Payment Details' },
      ]},
      { name: 'CSR Projects', items: [
        { key: 'proj-new', label: 'Propose New Project' },
        { key: 'proj-active', label: 'Active Projects' },
        { key: 'proj-draft', label: 'Draft Projects' },
        { key: 'proj-completed', label: 'Completed Projects' },
        { key: 'proj-approval', label: 'Approval Status' },
      ]},
      { name: 'Beneficiaries', items: [
        { key: 'bene-register', label: 'Register Beneficiary' },
        { key: 'bene-list', label: 'Beneficiary List' },
        { key: 'bene-track', label: 'Track Progress' },
        { key: 'bene-placement', label: 'Placement Outcomes' },
      ]},
      { name: 'Training Partners', items: [
        { key: 'tp-list', label: 'Empanelled Partners' },
        { key: 'tp-add', label: 'Add Training Partner' },
        { key: 'tp-performance', label: 'Partner Performance' },
        { key: 'tp-mou', label: 'MoU / Agreements' },
      ]},
      { name: 'Fund Management', items: [
        { key: 'fund-allocation', label: 'Fund Allocation' },
        { key: 'fund-disbursements', label: 'Disbursements' },
        { key: 'fund-utilization', label: 'Utilization Reports' },
        { key: 'fund-unspent', label: 'Unspent CSR Funds' },
      ]},
      { name: 'Govt Schemes', items: [
        { key: 'scheme-pmkvy', label: 'PMKVY' },
        { key: 'scheme-ddugky', label: 'DDU-GKY' },
        { key: 'scheme-star', label: 'STAR Scheme' },
        { key: 'scheme-naps', label: 'NAPS / NATS' },
      ]},
      { name: 'Reports', items: [
        { key: 'rep-impact', label: 'Impact Reports' },
        { key: 'rep-financial', label: 'Financial Reports' },
        { key: 'rep-annual', label: 'Annual CSR Report' },
        { key: 'rep-sector', label: 'Sector-wise Report' },
        { key: 'rep-geo', label: 'Geographic Report' },
      ]},
      { name: 'Compliance', items: [
        { key: 'comp-schedule7', label: 'Schedule VII' },
        { key: 'comp-csr1', label: 'Form CSR-1' },
        { key: 'comp-csr2', label: 'Form CSR-2' },
        { key: 'comp-board', label: 'Board Resolutions' },
        { key: 'comp-audit', label: 'Audit Trail' },
      ]},
      { name: 'Support', items: [
        { key: 'helpdesk', label: 'Helpdesk' },
        { key: 'grievance', label: 'Grievance' },
        { key: 'faq', label: 'FAQ' },
      ]},
    ],
  },
  placement_agency: {
    label: 'Placement Agency', icon: '🎯', color: '#DC2626',
    sections: [
      { name: 'Main', items: [
        { key: 'dashboard', label: 'Dashboard', locked: true },
        { key: 'notifications', label: 'Notifications' },
      ]},
      { name: 'Agency Profile', items: [
        { key: 'profile-info', label: 'Agency Information', locked: true },
        { key: 'profile-contact', label: 'Contact & Address' },
        { key: 'profile-docs', label: 'Documents & Licenses' },
        { key: 'profile-bank', label: 'Bank Details' },
      ]},
      { name: 'Job Postings', items: [
        { key: 'jobs-post', label: 'Post a Job' },
        { key: 'jobs-active', label: 'Active Jobs' },
        { key: 'jobs-draft', label: 'Drafts' },
        { key: 'jobs-closed', label: 'Closed Jobs' },
      ]},
      { name: 'Candidates', items: [
        { key: 'cand-search', label: 'Search Candidates' },
        { key: 'cand-shortlisted', label: 'Shortlisted' },
        { key: 'cand-applications', label: 'Applications Received' },
        { key: 'cand-interview', label: 'Interview Pipeline' },
        { key: 'cand-offer', label: 'Offer Letters' },
      ]},
      { name: 'Placement Tracker', items: [
        { key: 'pl-active', label: 'Active Placements' },
        { key: 'pl-completed', label: 'Completed Placements' },
        { key: 'pl-dropout', label: 'Dropout / Withdrawn' },
        { key: 'pl-incentive', label: 'Incentive Claims' },
      ]},
      { name: 'Employers', items: [
        { key: 'emp-list', label: 'Registered Employers' },
        { key: 'emp-add', label: 'Add Employer' },
        { key: 'emp-mou', label: 'MoU / Agreements' },
        { key: 'emp-demand', label: 'Demand Requests' },
      ]},
      { name: 'Govt Schemes', items: [
        { key: 'scheme-pmkvy', label: 'PMKVY Placement' },
        { key: 'scheme-naps', label: 'NAPS / NATS' },
        { key: 'scheme-ddugky', label: 'DDU-GKY' },
        { key: 'scheme-pli', label: 'PLI — Placement Linked' },
      ]},
      { name: 'Reports', items: [
        { key: 'rep-placement', label: 'Placement Reports' },
        { key: 'rep-candidate', label: 'Candidate Reports' },
        { key: 'rep-employer', label: 'Employer Reports' },
        { key: 'rep-monthly', label: 'Monthly Summary' },
        { key: 'rep-incentive', label: 'Incentive Reports' },
      ]},
      { name: 'Support', items: [
        { key: 'helpdesk', label: 'Helpdesk' },
        { key: 'grievance', label: 'Grievance' },
        { key: 'faq', label: 'FAQ' },
      ]},
    ],
  },
  state_government: {
    label: 'State Government', icon: '🏛️', color: '#1D4ED8',
    sections: [
      { name: 'Main', items: [
        { key: 'dashboard', label: 'Dashboard', locked: true },
        { key: 'notifications', label: 'Notifications' },
        { key: 'live-analytics', label: 'Live Analytics' },
      ]},
      { name: 'Schemes & Programs', items: [
        { key: 'pmkvy', label: 'PMKVY 4.0' },
        { key: 'ddu-gky', label: 'DDU-GKY' },
        { key: 'naps', label: 'NAPS / NATS' },
        { key: 'state-scheme', label: 'State Skill Mission' },
        { key: 'csr-programs', label: 'CSR Programs' },
      ]},
      { name: 'Targets & Budget', items: [
        { key: 'targets', label: 'Targets & Allocation' },
        { key: 'financial', label: 'Financial Management' },
      ]},
      { name: 'Ecosystem', items: [
        { key: 'training-partners', label: 'Training Partners' },
        { key: 'training-centers', label: 'Training Centers' },
        { key: 'trainers', label: 'Trainers & Assessors' },
        { key: 'candidate-list', label: 'Candidates / Learners' },
        { key: 'cert-verify', label: 'Certificate Verification' },
        { key: 'grievances', label: 'Grievance Redressal' },
      ]},
      { name: 'Reports & Analytics', items: [
        { key: 'sectors', label: 'Sector-wise Data' },
        { key: 'employers', label: 'Employer Partners' },
        { key: 'mis-district', label: 'District-wise MIS' },
        { key: 'mis-monthly', label: 'Monthly MIS Report' },
        { key: 'mis-scheme', label: 'Scheme-wise Report' },
        { key: 'mis-placement', label: 'Placement Analytics' },
      ]},
      { name: 'Administration', items: [
        { key: 'audit-logs', label: 'Audit Logs' },
        { key: 'users', label: 'User Management' },
        { key: 'settings', label: 'Settings' },
      ]},
    ],
  },
};

const PERMS_KEY = 'snj_role_perms';

function loadPerms() {
  try { return JSON.parse(localStorage.getItem(PERMS_KEY) || '{}'); } catch { return {}; }
}

function buildDefaultPerms() {
  const perms = {};
  for (const [role, cfg] of Object.entries(ROLE_MENUS)) {
    perms[role] = {};
    for (const sec of cfg.sections)
      for (const item of sec.items)
        perms[role][item.key] = true;
  }
  return perms;
}

function PanelRoles({ stats }) {
  const s = stats || {};
  const roleCounts = s.roleCounts || {};

  const ROLES = Object.keys(ROLE_MENUS);
  const defaults = buildDefaultPerms();

  const [selectedRole, setSelectedRole] = useState(ROLES[0]);
  const [perms, setPerms] = useState(defaults);
  const [dbLoaded, setDbLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(''); // '' | 'saved' | 'error'
  const [openSecs, setOpenSecs] = useState({});

  // Load from DB on mount; fall back to localStorage for offline support
  useEffect(() => {
    api.getRolePermissions()
      .then(dbPerms => {
        const merged = buildDefaultPerms();
        for (const role of ROLES) {
          if (dbPerms[role]) merged[role] = { ...merged[role], ...dbPerms[role] };
        }
        setPerms(merged);
        setDbLoaded(true);
      })
      .catch(() => {
        // Fallback: load from localStorage
        const saved = loadPerms();
        const merged = buildDefaultPerms();
        for (const role of ROLES) {
          if (saved[role]) merged[role] = { ...merged[role], ...saved[role] };
        }
        setPerms(merged);
        setDbLoaded(true);
      });
  }, []);

  const cfg = ROLE_MENUS[selectedRole];
  const rolePerms = perms[selectedRole] || {};

  function toggleItem(key) {
    setPerms(p => ({ ...p, [selectedRole]: { ...p[selectedRole], [key]: !p[selectedRole][key] } }));
    setSaveStatus('');
  }

  function toggleSection(sec, allOn) {
    const update = {};
    for (const item of sec.items) {
      if (!item.locked) update[item.key] = !allOn;
    }
    setPerms(p => ({ ...p, [selectedRole]: { ...p[selectedRole], ...update } }));
    setSaveStatus('');
  }

  async function savePerms() {
    setSaving(true);
    setSaveStatus('');
    try {
      await api.saveRolePermissions(selectedRole, perms[selectedRole]);
      // Also mirror to localStorage as offline cache
      localStorage.setItem(PERMS_KEY, JSON.stringify(perms));
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(''), 4000);
    }
    setSaving(false);
  }

  function resetRole() {
    setPerms(p => ({ ...p, [selectedRole]: defaults[selectedRole] }));
    setSaveStatus('');
  }

  const enabledCount = Object.values(rolePerms).filter(Boolean).length;
  const totalCount = Object.values(rolePerms).length;

  return (
    <>
      <div className="ph">
        <h1>Roles & Permissions</h1>
        <p>Control which menu items each user role can access across their portal</p>
      </div>

      {/* Role distribution KPIs */}
      <div className="kpi-grid" style={{marginBottom:16}}>
        {Object.entries(ROLE_LABEL).filter(([r]) => ROLE_MENUS[r]).map(([role, label]) => (
          <div key={role} className="kpi" style={{'--c': ROLE_MENUS[role]?.color || '#003366', cursor:'pointer', outline: selectedRole===role ? `2px solid ${ROLE_MENUS[role]?.color}` : 'none', outlineOffset:2}}
            onClick={() => setSelectedRole(role)}>
            <div className="val" style={{fontSize:20}}>{ROLE_MENUS[role]?.icon}</div>
            <div className="lbl">{label}</div>
            <div className="sub">{roleCounts[role] || s[role+'Count'] || '0'} users</div>
          </div>
        ))}
      </div>

      {/* Permissions editor */}
      <div className="card" style={{padding:0,overflow:'hidden'}}>
        {/* Header bar */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 18px',background:'#F8FAFC',borderBottom:'1px solid #E0E6EF'}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <span style={{fontSize:20}}>{cfg.icon}</span>
            <div>
              <div style={{fontWeight:700,fontSize:13,color:'#003366'}}>{cfg.label} — Menu Permissions</div>
              <div style={{fontSize:11,color:'#6B7FA3'}}>{enabledCount} of {totalCount} menus enabled</div>
            </div>
          </div>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            {saveStatus === 'saved' && <span style={{fontSize:11,color:'#007B5E',fontWeight:700}}>✓ Saved to database</span>}
            {saveStatus === 'error' && <span style={{fontSize:11,color:'#DC2626',fontWeight:700}}>✗ Save failed</span>}
            {!dbLoaded && <span style={{fontSize:11,color:'#94A3B8'}}>Loading…</span>}
            <button className="sa-btn btn-outline" onClick={resetRole} disabled={saving}>↺ Reset</button>
            <button className="sa-btn btn-primary" onClick={savePerms} disabled={saving || !dbLoaded}>
              {saving ? '⏳ Saving…' : '💾 Save Changes'}
            </button>
          </div>
        </div>

        {/* Role tabs */}
        <div style={{display:'flex',borderBottom:'1px solid #E0E6EF',overflowX:'auto',background:'#fff'}}>
          {ROLES.map(role => {
            const rc = ROLE_MENUS[role];
            const rp = perms[role] || {};
            const on = Object.values(rp).filter(Boolean).length;
            const tot = Object.values(rp).length;
            return (
              <button key={role} onClick={() => setSelectedRole(role)} style={{
                display:'flex',alignItems:'center',gap:6,padding:'10px 16px',border:'none',borderBottom: selectedRole===role ? `2px solid ${rc.color}` : '2px solid transparent',
                background:'none',cursor:'pointer',whiteSpace:'nowrap',fontSize:12,fontWeight:selectedRole===role?700:500,
                color: selectedRole===role ? rc.color : '#6B7FA3',
              }}>
                <span>{rc.icon}</span> {rc.label}
                <span style={{fontSize:10,background: selectedRole===role ? rc.color : '#E0E6EF',color: selectedRole===role?'#fff':'#6B7FA3',padding:'1px 6px',borderRadius:10,fontWeight:700}}>
                  {on}/{tot}
                </span>
              </button>
            );
          })}
        </div>

        {/* Sections + items */}
        <div style={{padding:16}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:12}}>
            {cfg.sections.map(sec => {
              const allItems = sec.items;
              const enabledInSec = allItems.filter(i => rolePerms[i.key]).length;
              const allOn = enabledInSec === allItems.length;
              const someOn = enabledInSec > 0 && !allOn;
              const isOpen = openSecs[sec.name] !== false; // default open
              return (
                <div key={sec.name} style={{border:'1px solid #E0E6EF',borderRadius:8,overflow:'hidden'}}>
                  {/* Section header */}
                  <div style={{display:'flex',alignItems:'center',gap:8,padding:'8px 12px',background:'#F8FAFC',cursor:'pointer',userSelect:'none'}}
                    onClick={() => setOpenSecs(p => ({...p, [sec.name]: !isOpen}))}>
                    <input type="checkbox" checked={allOn} ref={el => el && (el.indeterminate = someOn)}
                      onChange={() => toggleSection(sec, allOn)}
                      onClick={e => e.stopPropagation()}
                      style={{width:14,height:14,cursor:'pointer'}} />
                    <span style={{flex:1,fontWeight:700,fontSize:11,color:'#003366',textTransform:'uppercase',letterSpacing:'.04em'}}>{sec.name}</span>
                    <span style={{fontSize:10,color:'#6B7FA3'}}>{enabledInSec}/{allItems.length}</span>
                    <span style={{fontSize:10,color:'#94A3B8',transform: isOpen?'none':'rotate(-90deg)',display:'inline-block',transition:'transform .15s'}}>▾</span>
                  </div>
                  {/* Items */}
                  {isOpen && (
                    <div>
                      {allItems.map(item => (
                        <label key={item.key} style={{display:'flex',alignItems:'center',gap:10,padding:'7px 12px',borderTop:'1px solid #F1F5F9',cursor:item.locked?'default':'pointer',background:item.locked?'#FAFBFC':'#fff'}}>
                          <input type="checkbox" checked={!!rolePerms[item.key]} disabled={item.locked}
                            onChange={() => !item.locked && toggleItem(item.key)}
                            style={{width:14,height:14,cursor:item.locked?'default':'pointer',accentColor:cfg.color}} />
                          <span style={{flex:1,fontSize:12,color: rolePerms[item.key] ? '#1A2B4A' : '#94A3B8'}}>{item.label}</span>
                          {item.locked && <span style={{fontSize:9,color:'#94A3B8',background:'#F1F5F9',padding:'1px 6px',borderRadius:4,fontWeight:600}}>LOCKED</span>}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

function PanelSchemeCSR() {
  const [data, loading] = useLoad(() => api.csrStats());
  const stats = data || {};
  return (
    <>
      <div className="ph"><h1>CSR-Funded Programs</h1><p>Corporate Social Responsibility skill programs</p></div>
      <div className="kpi-grid">
        <div className="kpi" style={{'--c':'#003366'}}><div className="val">{stats.totalProjects||0}</div><div className="lbl">Total Projects</div></div>
        <div className="kpi" style={{'--c':'#007B5E'}}><div className="val">{stats.activeProjects||0}</div><div className="lbl">Active</div></div>
        <div className="kpi" style={{'--c':'#FF6B00'}}><div className="val">{stats.totalBeneficiaries||0}</div><div className="lbl">Beneficiaries</div></div>
        <div className="kpi" style={{'--c':'#7C3AED'}}><div className="val">₹{((stats.totalFunds||0)/10000000).toFixed(1)} Cr</div><div className="lbl">Total Funds</div></div>
      </div>
      <div className="card">
        {loading ? <Loading /> : <Empty icon="🤝" msg="CSR project details will appear here." />}
      </div>
    </>
  );
}

// Generic "no backend yet" panel
function PanelSessions({ subview }) {
  const [sessions, loading] = useLoad(() => api.adminSessions());
  const list = Array.isArray(sessions) ? sessions : [];

  const today = new Date().toISOString().slice(0, 10);
  const scheduled  = list.filter(s => s.status === 'scheduled');
  const completed  = list.filter(s => s.status === 'completed');
  const cancelled  = list.filter(s => s.status === 'cancelled');
  const todayList  = list.filter(s => s.session_date === today);

  const modeCount = list.reduce((acc, s) => { acc[s.mode] = (acc[s.mode] || 0) + 1; return acc; }, {});

  const STATUS_COLOR = { scheduled: 'blue', completed: 'green', cancelled: 'red', ongoing: 'amber' };

  // Filter by subview
  const viewMap = {
    'sessions-all':        list,
    'sessions-schedule':   scheduled,
    'sessions-attendance': todayList,
    'sessions-content':    list,
  };
  const display = viewMap[subview] || list;

  const titles = {
    'sessions-all':        'All Sessions',
    'sessions-schedule':   'Scheduled Sessions',
    'sessions-attendance': "Today's Sessions",
    'sessions-content':    'Course Content & Materials',
  };

  return (
    <>
      <div className="ph">
        <h1>{titles[subview] || 'Session Management'}</h1>
        <p>All training sessions across trainers and batches</p>
      </div>

      <div className="kpi-grid">
        <div className="kpi" style={{'--c':'#003366'}}><div className="val">{list.length}</div><div className="lbl">Total Sessions</div></div>
        <div className="kpi" style={{'--c':'#1D4ED8'}}><div className="val">{scheduled.length}</div><div className="lbl">Scheduled</div></div>
        <div className="kpi" style={{'--c':'#007B5E'}}><div className="val">{completed.length}</div><div className="lbl">Completed</div></div>
        <div className="kpi" style={{'--c':'#DC2626'}}><div className="val">{cancelled.length}</div><div className="lbl">Cancelled</div></div>
        <div className="kpi" style={{'--c':'#FF6B00'}}><div className="val">{todayList.length}</div><div className="lbl">Today</div></div>
      </div>

      {Object.keys(modeCount).length > 0 && (
        <div className="card" style={{marginBottom:14}}>
          <div className="card-title">📊 Sessions by Mode</div>
          <div style={{display:'flex',gap:16,flexWrap:'wrap'}}>
            {Object.entries(modeCount).map(([mode, cnt]) => (
              <div key={mode} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 14px',background:'#F8FAFC',borderRadius:8,border:'1px solid #E0E6EF'}}>
                <span style={{fontWeight:700,color:'#003366',fontSize:18}}>{cnt}</span>
                <span style={{fontSize:12,color:'#6B7FA3'}}>{mode}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-hdr">
          <div className="card-title" style={{margin:0}}>{titles[subview] || 'All Sessions'} ({display.length})</div>
        </div>
        {loading ? <Loading /> : display.length === 0 ? <Empty icon="📅" msg="No sessions found." /> : (
          <table className="sa-table">
            <thead>
              <tr>
                <th>Topic</th>
                <th>Trainer</th>
                <th>Batch</th>
                <th>Date</th>
                <th>Time</th>
                <th>Duration</th>
                <th>Mode</th>
                <th>Venue</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {display.map(s => (
                <tr key={s.id}>
                  <td style={{fontWeight:600,maxWidth:200}}>{s.topic}</td>
                  <td>
                    <div style={{fontWeight:600,fontSize:12}}>{s.trainer_name || '—'}</div>
                    <div style={{fontSize:10.5,color:'#6B7FA3'}}>{s.trainer_email}</div>
                  </td>
                  <td style={{fontSize:11}}>
                    {s.batch_code ? <><span className="pill blue" style={{fontSize:9}}>{s.batch_code}</span><div style={{fontSize:10.5,color:'#6B7FA3',marginTop:2}}>{s.batch_name || s.course_name || ''}</div></> : '—'}
                  </td>
                  <td style={{whiteSpace:'nowrap',fontSize:12}}>{s.session_date || '—'}</td>
                  <td style={{fontSize:12,color:'#6B7FA3'}}>{s.start_time || '—'}</td>
                  <td style={{fontSize:12}}>{s.duration_hrs ? `${s.duration_hrs}h` : '—'}</td>
                  <td><span className="pill gray" style={{fontSize:9}}>{s.mode || '—'}</span></td>
                  <td style={{fontSize:11,color:'#6B7FA3',maxWidth:120,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.venue || '—'}</td>
                  <td><Pill v={s.status || 'scheduled'} map={STATUS_COLOR} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

function PanelComingSoon({ title, desc, icon = '🚧' }) {
  return (
    <>
      <div className="ph"><h1>{title}</h1><p>{desc}</p></div>
      <div className="card" style={{textAlign:'center',padding:48}}>
        <div style={{fontSize:48,marginBottom:14}}>{icon}</div>
        <div style={{fontSize:14,fontWeight:700,color:'#003366',marginBottom:6}}>No backend data yet</div>
        <div style={{fontSize:12,color:'#6B7FA3'}}>This section requires a dedicated API route. Connect the backend to see real data here.</div>
      </div>
    </>
  );
}

// ── Main component ─────────────────────────────────────────────
export default function SuperadminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeId, setActiveId] = useState('dashboard');
  const [openGroups, setOpenGroups] = useState({});
  const [collapsedSections, setCollapsedSections] = useState({});
  const [stats, setStats] = useState({});

  useEffect(() => {
    api.dashboardStats().then(setStats).catch(() => {});
  }, []);

  const navFlat = NAV.flatMap(g => g.items.flatMap(i => i.children ? [i, ...i.children] : [i]));

  function getLabel(id) { return navFlat.find(i => i.id === id)?.label || id; }

  function getSection(id) {
    for (const g of NAV) {
      for (const item of g.items) {
        if (item.id === id) return g.section;
        if (item.children?.find(c => c.id === id)) return item.label;
      }
    }
    return 'Platform';
  }

  function handleItem(id, hasChildren, parentId) {
    if (hasChildren) { setOpenGroups(p => ({ ...p, [id]: !p[id] })); }
    setActiveId(id);
    if (parentId && !openGroups[parentId]) setOpenGroups(p => ({ ...p, [parentId]: true }));
  }

  function renderPanel() {
    switch (activeId) {
      case 'dashboard': return <PanelDashboard stats={stats} />;
      case 'notifications': return <PanelNotifications stats={stats} />;
      case 'analytics': return <PanelAnalytics stats={stats} />;

      case 'users-all': return <PanelAllUsers />;
      case 'users-candidates': return <PanelUsers role="candidate" title="Candidates / Learners" />;
      case 'users-tp': return <PanelUsers role="training_vendor" title="Training Partners" />;
      case 'users-trainers': return <PanelUsers role="trainer" title="Trainers & Assessors" />;
      case 'users-employers': return <PanelUsers role="employer" title="Employers" />;
      case 'users-csr': return <PanelUsers role="csr_org" title="CSR Organizations" />;
      case 'users-placement': return <PanelUsers role="placement_agency" title="Placement Agencies" />;
      case 'users-govt': return <PanelUsers role="state_government" title="Government Officials" />;
      case 'roles': return <PanelRoles stats={stats} />;
      case 'bulk-import': return <PanelComingSoon title="Bulk Import / Export" desc="Upload users, courses or jobs in bulk via CSV." icon="📥" />;

      case 'tp-list':
      case 'tp-verify':
      case 'tp-accred':
      case 'tp-perf': return <PanelTrainingPartners subview={activeId} />;

      case 'centers-list':
      case 'centers-audit':
      case 'centers-geo': return <PanelCentres subview={activeId} />;

      case 'tr-list':
      case 'tr-assess':
      case 'tr-certs': return <PanelTrainers subview={activeId} />;

      case 'sessions':
      case 'sessions-all':
      case 'sessions-schedule':
      case 'sessions-attendance':
      case 'sessions-content': return <PanelSessions subview={activeId} />;

      case 'course-catalogue':
      case 'course-nsqf':
      case 'course-approve':
      case 'course-upload': return <PanelCourses subview={activeId} />;

      case 'sectors': return <PanelComingSoon title="Sectors & Job Roles" desc="NSQF sector taxonomy and job role registry." icon="🏭" />;

      case 'pmkvy': return <PanelComingSoon title="PMKVY 4.0" desc="Pradhan Mantri Kaushal Vikas Yojana scheme data." icon="🇮🇳" />;
      case 'ddugky': return <PanelComingSoon title="DDU-GKY" desc="Deen Dayal Upadhyaya Grameen Kaushalya Yojana data." icon="🌾" />;
      case 'naps': return <PanelComingSoon title="NAPS (Apprenticeship)" desc="National Apprenticeship Promotion Scheme data." icon="🔧" />;
      case 'state-skill': return <PanelComingSoon title="State Skill Missions" desc="State-wise skill mission programme data." icon="🏛️" />;
      case 'csr-prog': return <PanelSchemeCSR />;
      case 'fee-prog': return <PanelComingSoon title="Fee-Based Programs" desc="Self-funded and fee-based course programmes." icon="💰" />;
      case 'scheme-config': return <PanelComingSoon title="Scheme Configuration" desc="Configure scheme parameters, targets and eligibility." icon="⚙️" />;

      case 'candidate-reg': return <PanelCandidates />;
      case 'enrolments': return <PanelEnrolments />;
      case 'batches': return <PanelBatches />;
      case 'attendance': return <PanelComingSoon title="Attendance" desc="Batch-level attendance records and compliance." icon="✅" />;
      case 'dropout': return <PanelComingSoon title="Dropout Management" desc="Dropout analysis and intervention tracking." icon="⚠️" />;
      case 'target-ben': return <PanelTargetBeneficiaries />;

      case 'assess-agencies': return <PanelComingSoon title="Assessment Agencies" desc="Empanelled agencies conducting skill assessments." icon="🏅" />;
      case 'assess-sched': return <PanelComingSoon title="Scheduled Assessments" desc="Upcoming and completed assessment schedules." icon="📆" />;
      case 'results': return <PanelComingSoon title="Results & Marks" desc="Assessment results and candidate score records." icon="📊" />;
      case 'certificates': return <PanelComingSoon title="Certificate Generation" desc="Issue and manage skill certificates." icon="📜" />;
      case 'cert-verify': return <PanelComingSoon title="Certificate Verification" desc="Verify candidate certificates by certificate number." icon="🔍" />;
      case 'badges': return <PanelComingSoon title="Digital Badges" desc="Issue verifiable digital badges linked to certifications." icon="🎖️" />;

      case 'jobs': return <PanelJobs />;
      case 'employers': return <PanelUsers role="employer" title="Employer Registry" />;
      case 'placements': return <PanelPlacements />;
      case 'place-partners': return <PanelUsers role="placement_agency" title="Placement Partners" />;
      case 'emp-verify': return <PanelComingSoon title="Employment Verification" desc="Verify candidate employment status post-placement." icon="✔️" />;
      case 'apprentice': return <PanelComingSoon title="Apprenticeship Portal" desc="NAPS/NATS apprenticeship registrations and tracking." icon="🔧" />;

      case 'fund-alloc': return <PanelComingSoon title="Fund Allocation" desc="Scheme-wise fund allocation records." icon="💵" />;
      case 'disbursements': return <PanelComingSoon title="Disbursements" desc="Training partner disbursement history and processing." icon="🏦" />;
      case 'claims': return <PanelComingSoon title="Training Cost Claims" desc="TP training cost claim submissions and approvals." icon="📄" />;
      case 'scheme-budget': return <PanelComingSoon title="Scheme-wise Budgets" desc="Scheme budget utilisation and remaining allocation." icon="📊" />;
      case 'fin-audit': return <PanelComingSoon title="Audit & Compliance" desc="Financial audit trail and compliance tracking." icon="🔎" />;
      case 'pay-reports': return <PanelComingSoon title="Payment Reports" desc="Detailed payment and disbursement reports." icon="📑" />;

      case 'mis': return <PanelComingSoon title="MIS Dashboard" desc="Management Information System — scheme-wise MIS reports." icon="📊" />;
      case 'sector-rpt': return <PanelComingSoon title="Sector-wise Reports" desc="Performance breakdown by industry sector." icon="🏭" />;
      case 'state-rpt': return <PanelComingSoon title="State-wise Reports" desc="State-level performance analytics." icon="🗺️" />;
      case 'scheme-rpt': return <PanelComingSoon title="Scheme Reports" desc="Scheme-wise progress and target achievement reports." icon="📋" />;
      case 'place-analytics': return <PanelComingSoon title="Placement Analytics" desc="Placement trends, employer analysis and salary benchmarks." icon="📈" />;
      case 'export': return <PanelComingSoon title="Export Centre" desc="Export any dataset as CSV, Excel or PDF." icon="📤" />;
      case 'custom-rpt': return <PanelComingSoon title="Custom Report Builder" desc="Build ad-hoc reports with custom filters and columns." icon="🛠️" />;

      case 'geo-states': return <PanelGeoStates />;
      case 'geo-aspire': return <PanelComingSoon title="Aspirational Districts" desc="Skill development focus on aspirational districts." icon="⭐" />;
      case 'geo-block': return <PanelComingSoon title="Block-level Mapping" desc="Block-level training centre and beneficiary mapping." icon="📌" />;
      case 'geo-rural': return <PanelComingSoon title="Rural / Urban Coverage" desc="Rural vs urban beneficiary and centre breakdown." icon="🌾" />;

      case 'announce': return <PanelComingSoon title="Announcements" desc="Broadcast announcements to all portal users." icon="📢" />;
      case 'push-notif': return <PanelComingSoon title="Push Notifications" desc="Send push notifications to specific user segments." icon="🔔" />;
      case 'email-tpl': return <PanelComingSoon title="Email Templates" desc="Manage email templates for automated communications." icon="✉️" />;
      case 'faq': return <PanelComingSoon title="FAQs & Help Centre" desc="Manage FAQ articles and help centre content." icon="❓" />;
      case 'doc-lib': return <PanelComingSoon title="Document Library" desc="Central repository for scheme guidelines and policy documents." icon="📁" />;

      case 'setup-sectors': return <PanelComingSoon title="Sectors & Categories" desc="Configure sector taxonomy and course categories." icon="🏭" />;
      case 'setup-jobroles': return <PanelComingSoon title="Job Roles (NSQF)" desc="Manage NSQF job role definitions and levels." icon="👔" />;
      case 'setup-accred': return <PanelAccreditations />;
      case 'setup-orgclass': return <PanelOrgClassifications />;
      case 'setup-skills': return <PanelComingSoon title="Skills Database" desc="Master skills taxonomy used across job and course matching." icon="💡" />;
      case 'setup-schemes': return <PanelComingSoon title="Government Schemes" desc="Configure government scheme definitions and parameters." icon="📜" />;
      case 'audit-logs': return <PanelAuditLogs />;
      case 'sys-settings': return <PanelComingSoon title="System Settings" desc="Platform-wide configuration and feature flags." icon="⚙️" />;
      case 'api-config': return <PanelComingSoon title="API Configuration" desc="Manage API keys, webhooks and third-party integrations." icon="🔗" />;

      default: return <PanelComingSoon title={getLabel(activeId)} desc="This module is under development." />;
    }
  }

  const initials = (user?.name || user?.first_name || 'SA').split(' ').map(p => p[0]).slice(0,2).join('').toUpperCase();

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="sa-wrap">
        <aside className="sa-sidebar">
          <div className="sa-logo" onClick={() => setActiveId('dashboard')}>
            <div style={{width:44,height:44,borderRadius:'50%',border:'2px solid #e0e8f4',background:'#fff',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',flexShrink:0}}>
              <img src="/logo.png" alt="SkillsNJobs" style={{width:34,height:34,objectFit:'contain'}} />
            </div>
            <div>
              <div className="brand-name">SkillsNJobs</div>
              <div className="brand-tag">Admin Portal</div>
            </div>
          </div>

          <nav className="sa-nav">
            {NAV.map(group => {
              const secCollapsed = collapsedSections[group.section];
              const totalItems = group.items.reduce((n, i) => n + 1 + (i.children?.length || 0), 0);
              return (
                <div key={group.section}>
                  <div
                    className="sa-section"
                    onClick={() => setCollapsedSections(p => ({ ...p, [group.section]: !p[group.section] }))}
                  >
                    <span>{group.section}</span>
                    <span className="sa-sec-chev" style={{transform: secCollapsed ? 'rotate(-90deg)' : 'none'}}>▾</span>
                  </div>
                  <div className="sa-sec-items" style={{maxHeight: secCollapsed ? '0px' : `${totalItems * 38 + 20}px`}}>
                    {group.items.map(item => {
                      const isOpen = openGroups[item.id];
                      const isParentActive = item.children?.some(c => c.id === activeId);
                      return (
                        <div key={item.id}>
                          <div
                            className={`sa-item${!item.children && activeId===item.id?' active':''}${item.children&&isParentActive?' parent-active':''}`}
                            onClick={() => handleItem(item.id, !!item.children)}
                          >
                            <span className="sa-icon">{item.icon||'•'}</span>
                            <span className="sa-lbl">
                              {item.label}
                              {item.tag && <span className={`sa-tag ${item.tagType}`}>{item.tag}</span>}
                            </span>
                            {item.badge && <span className="sa-badge">{item.badge}</span>}
                            {item.children && <span className="sa-chev" style={{transform:isOpen?'rotate(180deg)':'none'}}>▾</span>}
                          </div>
                          {item.children && (
                            <div className={`sa-children${isOpen?' open':''}`}>
                              {item.children.map(child => (
                                <div
                                  key={child.id}
                                  className={`sa-child${activeId===child.id?' active':''}`}
                                  onClick={() => handleItem(child.id, false, item.id)}
                                >· {child.label}</div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </nav>

        </aside>

        <div className="sa-main">
          <div className="sa-topbar">
            <div className="sa-breadcrumb">
              <span className="sa-tb-section">{getSection(activeId)}</span>
              <span className="sa-tb-section">/</span>
              <span className="sa-tb-title">{getLabel(activeId)}</span>
            </div>
            <div className="sa-actions">
              <div className="sa-user-info">
                <div className="sa-av">{initials}</div>
                <div>
                  <div className="sa-tb-uname">{user?.first_name||user?.name||'Super Admin'}</div>
                  <div className="sa-tb-urole">Superadmin</div>
                </div>
              </div>
              <button className="sa-signout-btn" onClick={() => { logout(); navigate('/'); }}>⏻ Sign Out</button>
            </div>
          </div>

          <div className="sa-content">
            {renderPanel()}
          </div>
        </div>
      </div>
    </>
  );
}
