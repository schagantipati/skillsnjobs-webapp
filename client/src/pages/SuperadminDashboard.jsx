import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import AccountPreferences from '../components/AccountPreferences.jsx';

const CSS = `
  .sa-wrap *{box-sizing:border-box;margin:0;padding:0}
  .sa-wrap{font-family:'Inter',system-ui,sans-serif;background:#F4F6F9;color:#1A2B4A;display:flex;height:100vh;overflow:hidden;font-size:13px}
  .sa-sidebar{width:196px;min-width:196px;background:#010E3C;display:flex;flex-direction:column;height:100vh;overflow:hidden;flex-shrink:0}
  .sa-logo{padding:0 12px;height:46px;display:flex;align-items:center;gap:8px;border-bottom:1px solid rgba(255,255,255,.1);cursor:pointer;flex-shrink:0}
  .sa-logo .brand-name{color:#fff;font-weight:800;font-size:12px;line-height:1.1}
  .sa-logo .brand-tag{color:rgba(255,255,255,.4);font-size:8.5px;font-weight:700;text-transform:uppercase;letter-spacing:.08em}
  .sa-nav{flex:1;overflow-y:auto;padding:4px 0}
  .sa-nav::-webkit-scrollbar{width:3px}
  .sa-nav::-webkit-scrollbar-thumb{background:rgba(255,255,255,.2);border-radius:3px}
  .sa-section{padding:7px 12px 2px;color:rgba(255,255,255,.35);font-size:8.5px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;display:flex;align-items:center;justify-content:space-between;cursor:pointer;user-select:none;border-radius:4px;margin:0 3px;transition:background .12s}
  .sa-section:hover{background:rgba(255,255,255,.05);color:rgba(255,255,255,.55)}
  .sa-section .sa-sec-chev{font-size:8px;transition:transform .2s;opacity:.55}
  .sa-sec-items{overflow:hidden;transition:max-height .25s ease}
  .sa-item{display:flex;align-items:center;gap:7px;padding:5px 8px;margin:1px 4px;cursor:pointer;border-radius:5px;color:rgba(255,255,255,.8);font-size:11.5px;font-weight:500;transition:background .12s;user-select:none}
  .sa-item:hover{background:rgba(255,255,255,.09)}
  .sa-item.active{background:rgba(255,255,255,.2);color:#fff;font-weight:700}
  .sa-item.parent-active{background:rgba(255,255,255,.1);color:#fff}
  .sa-item .sa-icon{font-size:13px;flex-shrink:0;width:18px;text-align:center}
  .sa-item .sa-lbl{flex:1;font-size:11.5px}
  .sa-item .sa-chev{font-size:9px;color:rgba(255,255,255,.4);transition:transform .18s;flex-shrink:0}
  .sa-item .sa-badge{background:#DC2626;color:#fff;font-size:8.5px;font-weight:700;padding:1px 4px;border-radius:9px;flex-shrink:0}
  .sa-item .sa-tag{display:inline-flex;align-items:center;padding:1px 5px;border-radius:4px;font-size:8px;font-weight:700;margin-left:3px}
  .sa-item .sa-tag.new{background:#D1FAE5;color:#065F46}
  .sa-item .sa-tag.soon{background:#FEF3C7;color:#92400E}
  .sa-children{overflow:hidden;max-height:0;transition:max-height .28s ease}
  .sa-children.open{max-height:600px}
  .sa-child{display:flex;align-items:center;gap:6px;padding:4px 8px 4px 32px;margin:0px 4px;cursor:pointer;border-radius:4px;color:rgba(255,255,255,.6);font-size:11px;transition:background .12s}
  .sa-child:hover{background:rgba(255,255,255,.09);color:#fff}
  .sa-child.active{background:rgba(255,255,255,.16);color:#fff;font-weight:600}
  .sa-footer{padding:8px 10px;border-top:1px solid rgba(255,255,255,.1);display:flex;align-items:center;gap:8px;flex-shrink:0}
  .sa-avatar{width:26px;height:26px;border-radius:50%;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;color:#fff;font-size:10px;font-weight:700;flex-shrink:0}
  .sa-footer .sa-uname{color:rgba(255,255,255,.9);font-size:10.5px;font-weight:700}
  .sa-footer .sa-urole{color:rgba(255,255,255,.4);font-size:9px;text-transform:capitalize}
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
    { id: 'notifications', icon: '🔔', label: 'Notifications' },
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

function PanelDashboard({ stats, onNavigate }) {
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
            {[['➕ Add Training Partner','btn-primary','tp-list'],['📥 Bulk Import Users','btn-teal','bulk-import'],['📊 Generate MIS Report','btn-outline','mis'],['🔍 Verify Certificates','btn-outline','tp-verify']].map(([lbl,cls,target]) => (
              <button key={lbl} className={`sa-btn ${cls}`} style={{textAlign:'left'}} onClick={() => onNavigate && onNavigate(target)}>{lbl}</button>
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

function PanelAssessScheduled() {
  const [data, loading] = useLoad(() => api.allAssessments());
  const [tab, setTab] = useState('all');
  if (loading) return <Loading />;
  const d = data || {};
  const trainer = d.trainer || [];
  const vendor  = d.vendor  || [];
  const today   = new Date().toISOString().slice(0, 10);
  const allRows = [
    ...trainer.map(r => ({ ...r, assess_date: r.date })),
    ...vendor.map(r  => ({ ...r, assess_date: r.scheduled_date })),
  ].sort((a, b) => new Date(a.assess_date || 0) - new Date(b.assess_date || 0));
  const upcoming  = allRows.filter(r => (r.assess_date || '') >= today && r.status !== 'completed' && r.status !== 'cancelled');
  const completed = allRows.filter(r => r.status === 'completed' || (r.assess_date || '') < today);
  const rows = tab === 'all' ? allRows : tab === 'upcoming' ? upcoming : tab === 'completed' ? completed : (d[tab] || []).map(r => ({ ...r, assess_date: r.date || r.scheduled_date }));
  return (
    <>
      <div className="ph"><h1>Scheduled Assessments</h1><p>Unified assessment schedule across Trainer and Vendor portals</p></div>
      <div className="kpi-grid">
        <div className="kpi" style={{'--c':'#1D4ED8'}}><div className="val">{allRows.length}</div><div className="lbl">Total</div></div>
        <div className="kpi" style={{'--c':'#D97706'}}><div className="val">{upcoming.length}</div><div className="lbl">Upcoming</div></div>
        <div className="kpi" style={{'--c':'#15803D'}}><div className="val">{completed.length}</div><div className="lbl">Completed</div></div>
        <div className="kpi" style={{'--c':'#6D28D9'}}><div className="val">{trainer.length}</div><div className="lbl">Trainer Portal</div></div>
      </div>
      <div className="card">
        <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap' }}>
          {[['all',`All (${allRows.length})`],['upcoming',`Upcoming (${upcoming.length})`],['completed',`Completed (${completed.length})`],['trainer',`Trainer (${trainer.length})`],['vendor',`Vendor (${vendor.length})`]].map(([k,lbl]) => (
            <button key={k} onClick={() => setTab(k)} style={{ padding:'5px 14px', borderRadius:20, border:'none', cursor:'pointer', fontWeight:600, fontSize:12, background: tab===k ? '#0B1E3D' : '#F1F5F9', color: tab===k ? '#fff' : '#374151' }}>{lbl}</button>
          ))}
        </div>
        {rows.length === 0 ? <Empty icon="📆" msg="No assessments found." /> : (
          <table className="sa-table">
            <thead><tr><th>Source</th><th>Owner</th><th>Batch</th><th>Type</th><th>Agency / Assessor</th><th>Date</th><th>Time Slot</th><th>Candidates</th><th>Marks (Pass/Total)</th><th>Status</th></tr></thead>
            <tbody>
              {rows.slice(0,300).map((r,i) => (
                <tr key={i}>
                  <td><span style={{ fontSize:10, padding:'2px 7px', borderRadius:10, background: r.source==='trainer'?'#D1FAE5':'#EDE9FE', color: r.source==='trainer'?'#15803D':'#6D28D9', fontWeight:700 }}>{r.source==='trainer'?'Trainer':'Vendor'}</span></td>
                  <td style={{ fontSize:'11px' }}>{r.owner_name||'—'}</td>
                  <td style={{ fontWeight:600, fontSize:'11px' }}>{r.batch_code||'—'}</td>
                  <td style={{ fontSize:'11px' }}>{r.type||'Final'}</td>
                  <td style={{ fontSize:'11px' }}>{r.agency||r.assessor||'—'}</td>
                  <td style={{ fontSize:'10.5px', color:'#6B7FA3' }}>{r.assess_date ? String(r.assess_date).slice(0,10) : '—'}</td>
                  <td style={{ fontSize:'10.5px' }}>{r.time_slot||'—'}</td>
                  <td style={{ fontWeight:700 }}>{r.candidate_count||0}</td>
                  <td style={{ fontSize:'11px' }}>{r.passing_marks||50}/{r.total_marks||100}</td>
                  <td><Pill v={r.status||'scheduled'} map={{ scheduled:'amber', confirmed:'blue', completed:'green', cancelled:'red' }} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

const KNOWN_AGENCIES = ['Wheebox','NSDC Assessment','Ernst & Young','MERIT-TNL','CDAC','NTTF','Manipal ProLearn'];

function PanelAssessAgencies() {
  const [data, loading] = useLoad(() => api.allAssessments());
  if (loading) return <Loading />;
  const d = data || {};
  // Build agency stats from actual assessment records
  const allRows = [...(d.trainer||[]), ...(d.vendor||[])];
  const agencyMap = {};
  allRows.forEach(r => {
    const name = r.agency || r.assessor;
    if (!name) return;
    if (!agencyMap[name]) agencyMap[name] = { name, total: 0, completed: 0, candidates: 0 };
    agencyMap[name].total++;
    if (r.status === 'completed') agencyMap[name].completed++;
    agencyMap[name].candidates += (r.candidate_count || 0);
  });
  // Merge known agencies that may not have records yet
  KNOWN_AGENCIES.forEach(a => { if (!agencyMap[a]) agencyMap[a] = { name: a, total: 0, completed: 0, candidates: 0 }; });
  const agencies = Object.values(agencyMap).sort((a, b) => b.total - a.total);
  return (
    <>
      <div className="ph"><h1>Assessment Agencies</h1><p>{agencies.length} empanelled agencies for skill certification assessments</p></div>
      <div className="kpi-grid">
        <div className="kpi" style={{'--c':'#1D4ED8'}}><div className="val">{agencies.length}</div><div className="lbl">Total Agencies</div></div>
        <div className="kpi" style={{'--c':'#15803D'}}><div className="val">{agencies.filter(a=>a.total>0).length}</div><div className="lbl">Active</div></div>
        <div className="kpi" style={{'--c':'#D97706'}}><div className="val">{agencies.reduce((s,a)=>s+a.candidates,0)}</div><div className="lbl">Total Candidates Assessed</div></div>
        <div className="kpi" style={{'--c':'#6D28D9'}}><div className="val">{agencies.reduce((s,a)=>s+a.completed,0)}</div><div className="lbl">Assessments Completed</div></div>
      </div>
      <div className="card">
        <table className="sa-table">
          <thead><tr><th>Agency Name</th><th>Assessments Scheduled</th><th>Completed</th><th>Candidates Assessed</th><th>Status</th></tr></thead>
          <tbody>
            {agencies.map((a, i) => (
              <tr key={i}>
                <td style={{ fontWeight:700 }}>{a.name}</td>
                <td style={{ fontWeight:700 }}>{a.total}</td>
                <td>{a.completed}</td>
                <td>{a.candidates}</td>
                <td><Pill v={a.total > 0 ? 'active' : 'empanelled'} map={{ active:'green', empanelled:'amber' }} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function PanelEnrolments() {
  const [data, loading] = useLoad(() => api.allEnrolments());
  const [tab, setTab] = useState('all');
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
  const [batches, loading] = useLoad(() => api.allBatches());
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
  const [data, loading] = useLoad(() => api.myPlacements());
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
  const [geo, loading, reload] = useLoad(() => api.geographicCoverage());
  const [list, setList] = useState([]);
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  useEffect(() => { setList(Array.isArray(geo) ? geo : []); }, [geo]);

  async function addRegion() {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      await api.addGeographicCoverage(newName.trim());
      setNewName(''); setMsg('✅ Added'); reload();
    } catch { setMsg('❌ Failed'); }
    setSaving(false);
  }
  async function toggleRegion(id, enabled) {
    try { await api.setGeographicCoverageStatus(id, !enabled); reload(); } catch {}
  }
  async function deleteRegion(id) {
    if (!window.confirm('Delete this region?')) return;
    try { await api.deleteGeographicCoverage(id); reload(); } catch {}
  }

  return (
    <>
      <div className="ph"><h1>States & Districts</h1><p>Geographic coverage configuration</p></div>
      <div className="kpi-grid">
        <div className="kpi" style={{'--c':'#003366'}}><div className="val">{list.length}</div><div className="lbl">Regions Configured</div></div>
        <div className="kpi" style={{'--c':'#007B5E'}}><div className="val">{list.filter(g=>g.is_enabled).length}</div><div className="lbl">Active</div></div>
        <div className="kpi" style={{'--c':'#DC2626'}}><div className="val">{list.filter(g=>!g.is_enabled).length}</div><div className="lbl">Disabled</div></div>
      </div>
      <div className="card">
        <div style={{display:'flex',gap:8,marginBottom:12}}>
          <input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="Add state / region…" style={{flex:1,padding:'7px 10px',borderRadius:6,border:'1.5px solid #E0E6EF',fontSize:12}} onKeyDown={e=>e.key==='Enter'&&addRegion()} />
          <button className="sa-btn btn-primary" onClick={addRegion} disabled={saving}>{saving?'Saving…':'+ Add'}</button>
        </div>
        {msg && <div style={{fontSize:12,marginBottom:8,color:msg.startsWith('✅')?'#007B5E':'#DC2626'}}>{msg}</div>}
        {loading ? <Loading /> : list.length === 0 ? <Empty icon="🗺️" msg="No geographic data configured." /> : (
          <table className="sa-table">
            <thead><tr><th>Region / State</th><th>Status</th><th>Added</th><th>Actions</th></tr></thead>
            <tbody>
              {list.map(g => (
                <tr key={g.id}>
                  <td style={{fontWeight:600}}>{g.name}</td>
                  <td><Pill v={g.is_enabled?'Active':'Disabled'} map={{Active:'green',Disabled:'red'}} /></td>
                  <td style={{fontSize:'10.5px',color:'#94A3B8'}}>{(g.created_at||'').slice(0,10)}</td>
                  <td style={{display:'flex',gap:6}}>
                    <button className={`sa-btn ${g.is_enabled?'btn-outline':'btn-teal'}`} style={{padding:'3px 10px',fontSize:11}} onClick={()=>toggleRegion(g.id,g.is_enabled)}>{g.is_enabled?'Disable':'Enable'}</button>
                    <button className="sa-btn btn-danger" style={{padding:'3px 10px',fontSize:11}} onClick={()=>deleteRegion(g.id)}>Delete</button>
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

function PanelAccreditations() {
  const [data, loading, reload] = useLoad(() => api.accreditations());
  const [list, setList] = useState([]);
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  useEffect(() => { setList(Array.isArray(data) ? data : []); }, [data]);

  async function addItem() {
    if (!newName.trim()) return;
    setSaving(true);
    try { await api.addAccreditation(newName.trim()); setNewName(''); setMsg('✅ Added'); reload(); }
    catch { setMsg('❌ Failed'); }
    setSaving(false);
  }
  async function toggleItem(id, enabled) {
    try { await api.setAccreditationStatus(id, !enabled); reload(); } catch {}
  }
  async function deleteItem(id) {
    if (!window.confirm('Delete this accreditation type?')) return;
    try { await api.deleteAccreditation(id); reload(); } catch {}
  }

  return (
    <>
      <div className="ph"><h1>Accreditation Types</h1><p>Configured accreditation types for training partners</p></div>
      <div className="kpi-grid">
        <div className="kpi" style={{'--c':'#003366'}}><div className="val">{list.length}</div><div className="lbl">Total Types</div></div>
        <div className="kpi" style={{'--c':'#007B5E'}}><div className="val">{list.filter(a=>a.is_enabled).length}</div><div className="lbl">Active</div></div>
      </div>
      <div className="card">
        <div style={{display:'flex',gap:8,marginBottom:12}}>
          <input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="Add accreditation type…" style={{flex:1,padding:'7px 10px',borderRadius:6,border:'1.5px solid #E0E6EF',fontSize:12}} onKeyDown={e=>e.key==='Enter'&&addItem()} />
          <button className="sa-btn btn-primary" onClick={addItem} disabled={saving}>{saving?'Saving…':'+ Add'}</button>
        </div>
        {msg && <div style={{fontSize:12,marginBottom:8,color:msg.startsWith('✅')?'#007B5E':'#DC2626'}}>{msg}</div>}
        {loading ? <Loading /> : list.length === 0 ? <Empty icon="🏅" msg="No accreditation types configured yet." /> : (
          <table className="sa-table">
            <thead><tr><th>Accreditation Type</th><th>Status</th><th>Added</th><th>Actions</th></tr></thead>
            <tbody>
              {list.map(a => (
                <tr key={a.id}>
                  <td style={{fontWeight:600}}>{a.name}</td>
                  <td><Pill v={a.is_enabled?'Active':'Disabled'} map={{Active:'green',Disabled:'red'}} /></td>
                  <td style={{fontSize:'10.5px',color:'#94A3B8'}}>{(a.created_at||'').slice(0,10)}</td>
                  <td style={{display:'flex',gap:6}}>
                    <button className={`sa-btn ${a.is_enabled?'btn-outline':'btn-teal'}`} style={{padding:'3px 10px',fontSize:11}} onClick={()=>toggleItem(a.id,a.is_enabled)}>{a.is_enabled?'Disable':'Enable'}</button>
                    <button className="sa-btn btn-danger" style={{padding:'3px 10px',fontSize:11}} onClick={()=>deleteItem(a.id)}>Delete</button>
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

function PanelOrgClassifications() {
  const [data, loading, reload] = useLoad(() => api.orgClassifications());
  const [list, setList] = useState([]);
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  useEffect(() => { setList(Array.isArray(data) ? data : []); }, [data]);

  async function addItem() {
    if (!newName.trim()) return;
    setSaving(true);
    try { await api.addOrgClassification(newName.trim()); setNewName(''); setMsg('✅ Added'); reload(); }
    catch { setMsg('❌ Failed'); }
    setSaving(false);
  }
  async function toggleItem(id, enabled) {
    try { await api.setOrgClassificationStatus(id, !enabled); reload(); } catch {}
  }
  async function deleteItem(id) {
    if (!window.confirm('Delete this classification?')) return;
    try { await api.deleteOrgClassification(id); reload(); } catch {}
  }

  return (
    <>
      <div className="ph"><h1>Organisation Classifications</h1><p>Organisation category types for the platform</p></div>
      <div className="card">
        <div style={{display:'flex',gap:8,marginBottom:12}}>
          <input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="Add classification…" style={{flex:1,padding:'7px 10px',borderRadius:6,border:'1.5px solid #E0E6EF',fontSize:12}} onKeyDown={e=>e.key==='Enter'&&addItem()} />
          <button className="sa-btn btn-primary" onClick={addItem} disabled={saving}>{saving?'Saving…':'+ Add'}</button>
        </div>
        {msg && <div style={{fontSize:12,marginBottom:8,color:msg.startsWith('✅')?'#007B5E':'#DC2626'}}>{msg}</div>}
        {loading ? <Loading /> : list.length === 0 ? <Empty icon="🏢" msg="No classifications configured yet." /> : (
          <table className="sa-table">
            <thead><tr><th>Classification</th><th>Status</th><th>Added</th><th>Actions</th></tr></thead>
            <tbody>
              {list.map(o => (
                <tr key={o.id}>
                  <td style={{fontWeight:600}}>{o.name}</td>
                  <td><Pill v={o.is_enabled?'Active':'Disabled'} map={{Active:'green',Disabled:'red'}} /></td>
                  <td style={{fontSize:'10.5px',color:'#94A3B8'}}>{(o.created_at||'').slice(0,10)}</td>
                  <td style={{display:'flex',gap:6}}>
                    <button className={`sa-btn ${o.is_enabled?'btn-outline':'btn-teal'}`} style={{padding:'3px 10px',fontSize:11}} onClick={()=>toggleItem(o.id,o.is_enabled)}>{o.is_enabled?'Disable':'Enable'}</button>
                    <button className="sa-btn btn-danger" style={{padding:'3px 10px',fontSize:11}} onClick={()=>deleteItem(o.id)}>Delete</button>
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

function PanelTargetBeneficiaries() {
  const [data, loading, reload] = useLoad(() => api.targetBeneficiaries());
  const [list, setList] = useState([]);
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  useEffect(() => { setList(Array.isArray(data) ? data : []); }, [data]);

  async function addItem() {
    if (!newName.trim()) return;
    setSaving(true);
    try { await api.addTargetBeneficiary(newName.trim()); setNewName(''); setMsg('✅ Added'); reload(); }
    catch { setMsg('❌ Failed'); }
    setSaving(false);
  }
  async function toggleItem(id, enabled) {
    try { await api.setTargetBeneficiaryStatus(id, !enabled); reload(); } catch {}
  }
  async function deleteItem(id) {
    if (!window.confirm('Delete this beneficiary category?')) return;
    try { await api.deleteTargetBeneficiary(id); reload(); } catch {}
  }

  return (
    <>
      <div className="ph"><h1>Target Beneficiaries</h1><p>Configured target beneficiary categories</p></div>
      <div className="kpi-grid">
        <div className="kpi" style={{'--c':'#003366'}}><div className="val">{list.length}</div><div className="lbl">Categories</div></div>
        <div className="kpi" style={{'--c':'#007B5E'}}><div className="val">{list.filter(t=>t.is_enabled).length}</div><div className="lbl">Active</div></div>
      </div>
      <div className="card">
        <div style={{display:'flex',gap:8,marginBottom:12}}>
          <input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="Add beneficiary category…" style={{flex:1,padding:'7px 10px',borderRadius:6,border:'1.5px solid #E0E6EF',fontSize:12}} onKeyDown={e=>e.key==='Enter'&&addItem()} />
          <button className="sa-btn btn-primary" onClick={addItem} disabled={saving}>{saving?'Saving…':'+ Add'}</button>
        </div>
        {msg && <div style={{fontSize:12,marginBottom:8,color:msg.startsWith('✅')?'#007B5E':'#DC2626'}}>{msg}</div>}
        {loading ? <Loading /> : list.length === 0 ? <Empty icon="🎯" msg="No beneficiary categories configured yet." /> : (
          <table className="sa-table">
            <thead><tr><th>Category</th><th>Status</th><th>Added</th><th>Actions</th></tr></thead>
            <tbody>
              {list.map(t => (
                <tr key={t.id}>
                  <td style={{fontWeight:600}}>{t.name}</td>
                  <td><Pill v={t.is_enabled?'Active':'Disabled'} map={{Active:'green',Disabled:'red'}} /></td>
                  <td style={{fontSize:'10.5px',color:'#94A3B8'}}>{(t.created_at||'').slice(0,10)}</td>
                  <td style={{display:'flex',gap:6}}>
                    <button className={`sa-btn ${t.is_enabled?'btn-outline':'btn-teal'}`} style={{padding:'3px 10px',fontSize:11}} onClick={()=>toggleItem(t.id,t.is_enabled)}>{t.is_enabled?'Disable':'Enable'}</button>
                    <button className="sa-btn btn-danger" style={{padding:'3px 10px',fontSize:11}} onClick={()=>deleteItem(t.id)}>Delete</button>
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
        { key: 'onboarding', label: 'Organisation Profile', locked: true },
      ]},
      { name: 'Training Centres', items: [
        { key: 'centres', label: 'Centre List' },
        { key: 'centres-add', label: 'Add Centre' },
      ]},
      { name: 'Trainers & Faculty', items: [
        { key: 'trainers', label: 'Trainer List' },
        { key: 'trainers-add', label: 'Add Trainer' },
      ]},
      { name: 'Courses', items: [
        { key: 'courses', label: 'Course Catalogue' },
        { key: 'courses-add', label: 'Add Course' },
      ]},
      { name: 'Batches', items: [
        { key: 'batches', label: 'All Batches' },
        { key: 'batches-add', label: 'Create Batch' },
      ]},
      { name: 'Candidates', items: [
        { key: 'candidates', label: 'All Candidates' },
        { key: 'candidates-add', label: 'Enrol Candidate' },
      ]},
      { name: 'Assessment', items: [
        { key: 'assess', label: 'All Assessments' },
        { key: 'assess-add', label: 'Schedule Assessment' },
      ]},
      { name: 'Certifications & Placements', items: [
        { key: 'certifications', label: 'Certifications' },
        { key: 'placements-tv', label: 'Placements' },
      ]},
      { name: 'Collaboration', items: [
        { key: 'collab-consortium', label: 'Consortium Builder' },
        { key: 'collab-partnership', label: 'Partnership Requests' },
        { key: 'collab-resources', label: 'Resource Sharing' },
        { key: 'collab-invitations', label: 'Invitations' },
      ]},
      { name: 'Analytics & Revenue', items: [
        { key: 'analytics', label: 'Analytics' },
        { key: 'ai-insights', label: 'AI Insights' },
        { key: 'revenue', label: 'Revenue' },
        { key: 'marketing', label: 'Marketing' },
        { key: 'reviews', label: 'Reviews & Feedback' },
      ]},
      { name: 'Compliance', items: [
        { key: 'reports', label: 'Reports & MIS' },
        { key: 'docs', label: 'Documents' },
        { key: 'grievance', label: 'Grievance & Support' },
      ]},
      { name: 'Account', items: [
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
        { key: 'profile-personal', label: 'Personal Information' },
        { key: 'profile-qualifications', label: 'Educational Qualifications' },
        { key: 'profile-experience', label: 'Work Experience' },
        { key: 'profile-expertise', label: 'Domain & Skills' },
        { key: 'profile-certifications', label: 'Certifications & Awards' },
        { key: 'profile-docs', label: 'Documents & KYC' },
      ]},
      { name: 'Batch Management', items: [
        { key: 'batch', label: 'Batch Management' },
        { key: 'batch-active', label: 'Active Batches' },
        { key: 'batch-upcoming', label: 'Upcoming Batches' },
        { key: 'batch-completed', label: 'Completed Batches' },
        { key: 'batch-create', label: 'Create New Batch' },
      ]},
      { name: 'Session Management', items: [
        { key: 'sessions', label: 'Session Management' },
        { key: 'session-schedule', label: 'Schedule Sessions' },
        { key: 'session-today', label: "Today's Sessions" },
        { key: 'session-calendar', label: 'Training Calendar' },
        { key: 'session-reschedule', label: 'Reschedule / Cancel' },
      ]},
      { name: 'Attendance', items: [
        { key: 'attendance', label: 'Attendance' },
        { key: 'attendance-mark', label: 'Mark Attendance' },
        { key: 'attendance-reports', label: 'Attendance Reports' },
        { key: 'attendance-summary', label: 'Batch-wise Summary' },
      ]},
      { name: 'Learners', items: [
        { key: 'learners', label: 'My Learners' },
        { key: 'learner-list', label: 'All Learners' },
        { key: 'learner-progress', label: 'Learning Progress' },
        { key: 'learner-dropout', label: 'Dropout / At-Risk' },
        { key: 'learner-placement', label: 'Placement Status' },
      ]},
      { name: 'Assessments', items: [
        { key: 'assessments', label: 'Assessments' },
        { key: 'assess-schedule', label: 'Assessment Schedule' },
        { key: 'assess-results', label: 'Results & Scorecards' },
        { key: 'assess-rpl', label: 'RPL Assessment' },
        { key: 'assess-mock', label: 'Mock Tests' },
      ]},
      { name: 'Course Content', items: [
        { key: 'content', label: 'Course Content' },
        { key: 'content-materials', label: 'Study Materials' },
        { key: 'content-videos', label: 'Video Lectures' },
        { key: 'content-upload', label: 'Upload Content' },
        { key: 'content-library', label: 'Resource Library' },
      ]},
      { name: 'Certificates', items: [
        { key: 'certificates', label: 'Certificates' },
        { key: 'cert-issue', label: 'Issue Certificates' },
        { key: 'cert-issued', label: 'Issued Certificates' },
        { key: 'cert-verify', label: 'Verify Certificate' },
      ]},
      { name: 'Reports', items: [
        { key: 'reports', label: 'Reports' },
        { key: 'report-batch', label: 'Batch Performance' },
        { key: 'report-attendance', label: 'Attendance Analytics' },
        { key: 'report-assessment', label: 'Assessment Analytics' },
        { key: 'report-placement', label: 'Placement Analytics' },
        { key: 'report-trainer', label: 'My Performance' },
      ]},
      { name: 'Govt Schemes', items: [
        { key: 'schemes', label: 'Govt Schemes' },
        { key: 'scheme-pmkvy', label: 'PMKVY 4.0' },
        { key: 'scheme-rpl', label: 'RPL — Prior Learning' },
        { key: 'scheme-naps', label: 'NAPS / NATS' },
        { key: 'scheme-ddu', label: 'DDU-GKY' },
      ]},
      { name: 'Support', items: [
        { key: 'helpdesk', label: 'Help & Support' },
        { key: 'grievance', label: 'Grievance' },
        { key: 'faq', label: 'FAQ' },
        { key: 'settings', label: 'Settings & Preferences' },
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
        { key: 'profile-basic', label: 'Basic Information' },
        { key: 'profile-edu', label: 'Education Details' },
        { key: 'profile-exp', label: 'Work Experience' },
        { key: 'profile-skills', label: 'Skills & Competencies' },
        { key: 'profile-docs', label: 'Documents & ID Proof' },
        { key: 'profile-pref', label: 'Job Preferences' },
        { key: 'skill-passport', label: 'Skill Passport' },
      ]},
      { name: 'Courses & Learning', items: [
        { key: 'courses', label: 'Courses' },
        { key: 'browse-courses', label: 'Browse Courses' },
        { key: 'my-courses', label: 'My Enrolled Courses' },
        { key: 'course-progress', label: 'Learning Progress' },
        { key: 'course-recommend', label: 'AI Recommendations' },
        { key: 'certificates', label: 'Certificates' },
        { key: 'assessments', label: 'Assessments' },
        { key: 'assess-upcoming', label: 'Upcoming Assessments' },
        { key: 'assess-completed', label: 'Completed Assessments' },
        { key: 'assess-results', label: 'Results & Scorecards' },
        { key: 'rpl', label: 'RPL Assessment' },
      ]},
      { name: 'AI Tools', items: [
        { key: 'ai-tools', label: 'AI Tools' },
        { key: 'resume-builder-ai', label: 'Resume Builder (AI)' },
        { key: 'ai-skill-gap', label: 'AI Skill Gap Analysis' },
      ]},
      { name: 'Jobs & Employment', items: [
        { key: 'jobs', label: 'Jobs' },
        { key: 'browse-jobs', label: 'Browse Jobs' },
        { key: 'my-applications', label: 'My Applications' },
        { key: 'saved-jobs', label: 'Saved Jobs' },
        { key: 'job-alerts', label: 'Job Alerts' },
        { key: 'placement-status', label: 'Placement Status' },
        { key: 'apprenticeship', label: 'Apprenticeship' },
        { key: 'apprentice-browse', label: 'Browse Opportunities' },
        { key: 'apprentice-applied', label: 'Applied' },
        { key: 'naps', label: 'NAPS Registration' },
        { key: 'career-group', label: 'Career Services' },
        { key: 'interviews', label: 'Interviews' },
        { key: 'mock-interviews', label: 'Mock Interviews' },
        { key: 'career-counselling', label: 'Career Counselling' },
        { key: 'career-path', label: 'Career Pathways' },
        { key: 'skills-endorsements', label: 'Skills & Endorsements' },
      ]},
      { name: 'Schemes & Benefits', items: [
        { key: 'schemes', label: 'Govt Schemes' },
        { key: 'pmkvy', label: 'PMKVY 4.0' },
        { key: 'naps-scheme', label: 'NAPS / NATS' },
        { key: 'rpl-scheme', label: 'RPL — Prior Learning' },
        { key: 'pmegp', label: 'PMEGP / Startup' },
        { key: 'scholarship', label: 'Scholarships & Stipends' },
        { key: 'financial-aid', label: 'Financial Assistance' },
      ]},
      { name: 'Support', items: [
        { key: 'helpdesk', label: 'Help & Support' },
        { key: 'grievance', label: 'Grievance' },
        { key: 'faq', label: 'FAQ' },
        { key: 'settings', label: 'Account Preferences' },
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
      { name: 'Talent & Insights', items: [
        { key: 'assessments', label: 'Assessments' },
        { key: 'ai-insights', label: 'AI Insights' },
        { key: 'saved-searches', label: 'Saved Searches' },
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
        { key: 'rep-sector', label: 'Sector-wise Reports' },
      ]},
      { name: 'Compliance', items: [
        { key: 'comp-labour', label: 'Labour Law' },
        { key: 'comp-pfesi', label: 'PF / ESI' },
        { key: 'comp-contract', label: 'Contract Labour' },
        { key: 'comp-audit', label: 'Audit Trail' },
      ]},
      { name: 'Account', items: [
        { key: 'employer-branding', label: 'Employer Branding' },
        { key: 'billing-plans', label: 'Billing & Plans' },
        { key: 'settings', label: 'Settings' },
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
        { key: 'settings', label: 'Account Preferences' },
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
        { key: 'settings', label: 'Account Preferences' },
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
      { name: 'Training Partners', items: [
        { key: 'tp-list', label: 'All Training Partners' },
        { key: 'tp-onboard', label: 'Onboarding & Approval' },
        { key: 'tp-verify', label: 'Accreditation & Verify' },
      ]},
      { name: 'Training Centers', items: [
        { key: 'tc-list', label: 'All Centers' },
        { key: 'tc-map', label: 'District Map View' },
      ]},
      { name: 'Trainers & Assessors', items: [
        { key: 'trainer-list', label: 'Trainer Registry' },
        { key: 'assessor-list', label: 'Assessor Registry' },
      ]},
      { name: 'Beneficiary Management', items: [
        { key: 'candidate-list', label: 'All Beneficiaries' },
        { key: 'enrolment', label: 'Enrolment Records' },
        { key: 'placements', label: 'Placement Tracking' },
        { key: 'dropouts', label: 'Dropout Analysis' },
        { key: 'cert-verify', label: 'Certificate Verification' },
        { key: 'grievances', label: 'Grievance Redressal' },
      ]},
      { name: 'Sectors & Employment', items: [
        { key: 'sectors', label: 'Sector-wise Data' },
        { key: 'employers', label: 'Employer Partners' },
      ]},
      { name: 'MIS & Reports', items: [
        { key: 'mis-monthly', label: 'Monthly MIS' },
        { key: 'mis-district', label: 'District Report' },
        { key: 'mis-scheme', label: 'Scheme-wise MIS' },
        { key: 'audit-logs', label: 'Audit Logs' },
      ]},
      { name: 'Administration', items: [
        { key: 'users', label: 'User Management' },
        { key: 'settings', label: 'Settings', locked: true },
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
  const [projects, projLoading] = useLoad(() => api.csrProjects ? api.csrProjects() : Promise.resolve([]));
  const stats = data || {};
  const projList = Array.isArray(projects) ? projects : [];
  return (
    <>
      <div className="ph"><h1>CSR-Funded Programs</h1><p>Corporate Social Responsibility skill programs</p></div>
      <div className="kpi-grid">
        <div className="kpi" style={{'--c':'#003366'}}><div className="val">{stats.totalProjects||projList.length||0}</div><div className="lbl">Total Projects</div></div>
        <div className="kpi" style={{'--c':'#007B5E'}}><div className="val">{stats.activeProjects||projList.filter(p=>p.status==='active').length||0}</div><div className="lbl">Active</div></div>
        <div className="kpi" style={{'--c':'#FF6B00'}}><div className="val">{stats.totalBeneficiaries||0}</div><div className="lbl">Beneficiaries</div></div>
        <div className="kpi" style={{'--c':'#7C3AED'}}><div className="val">₹{((stats.totalFunds||0)/10000000).toFixed(1)} Cr</div><div className="lbl">Total Funds</div></div>
      </div>
      <div className="card">
        {projLoading ? <Loading /> : projList.length === 0 ? <Empty icon="🤝" msg="No CSR projects found." /> : (
          <table className="sa-table">
            <thead><tr><th>Project Title</th><th>Activity</th><th>Implementing Agency</th><th>Budget</th><th>Status</th></tr></thead>
            <tbody>
              {projList.map(p => (
                <tr key={p.id}>
                  <td style={{fontWeight:600}}>{p.title||'—'}</td>
                  <td style={{fontSize:'11px'}}>{p.activity||p.schedule7||'—'}</td>
                  <td style={{fontSize:'11px'}}>{p.implementing_agency||'—'}</td>
                  <td style={{fontWeight:700,color:'#003366'}}>₹{((p.budget||0)/10000000).toFixed(2)} Cr</td>
                  <td><Pill v={p.status||'draft'} map={{active:'green',completed:'blue',draft:'amber',pending:'purple',rejected:'red'}} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
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

function PanelBulkImport() {
  const ENTITIES = [
    { key: 'candidates',         label: 'Candidates / Learners', icon: '👤', role: 'candidate',
      cols: ['name','email','password','phone','gender','location','bio'],
      sample: [['Rahul Kumar','rahul@example.com','Pass@1234','9876543210','M','Mumbai','Aspiring software developer']] },
    { key: 'training_partners',  label: 'Training Partners',     icon: '🏫', role: 'training_vendor',
      cols: ['name','email','password','org_name','location','phone'],
      sample: [['Skill Academy','info@skillacademy.com','Pass@1234','Skill Academy Pvt Ltd','Hyderabad','9800000001']] },
    { key: 'trainers',           label: 'Trainers',              icon: '👨‍🏫', role: 'trainer',
      cols: ['name','email','password','org_name','location','phone'],
      sample: [['Anita Sharma','anita@trainer.com','Pass@1234','Skill Academy Pvt Ltd','Pune','9800000002']] },
    { key: 'employers',          label: 'Employers',             icon: '🏢', role: 'employer',
      cols: ['name','email','password','org_name','location','phone'],
      sample: [['Infosys Ltd','hr@infosys.com','Pass@1234','Infosys Ltd','Bengaluru','9800000003']] },
    { key: 'csr_orgs',           label: 'CSR Organisations',     icon: '🤝', role: 'csr_org',
      cols: ['name','email','password','org_name','location','phone'],
      sample: [['Tata Trust','csr@tatatrust.com','Pass@1234','Tata Trusts','Mumbai','9800000004']] },
    { key: 'placement_agencies', label: 'Placement Agencies',    icon: '🎯', role: 'placement_agency',
      cols: ['name','email','password','org_name','location','phone'],
      sample: [['JobBridge','info@jobbridge.com','Pass@1234','JobBridge Pvt Ltd','Delhi','9800000005']] },
    { key: 'courses',            label: 'Courses',               icon: '📚', role: null,
      cols: ['title','provider','skill_tags','duration_weeks','level','fee','nsqf_level','description'],
      sample: [['Python for Data Science','SkillsNJobs','Python,Data Science,ML','12','Intermediate','0','4','Comprehensive Python DS course']] },
    { key: 'jobs',               label: 'Jobs',                  icon: '💼', role: null,
      cols: ['title','description','required_skills','location','job_type','salary_min','salary_max'],
      sample: [['Software Engineer','Build scalable apps','Python,React,Node.js','Bengaluru','Full-time','600000','1200000']] },
  ];

  const [tab, setTab] = useState(ENTITIES[0].key);
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const entity = ENTITIES.find(e => e.key === tab);

  function downloadTemplate(ent) {
    const rows = [ent.cols, ...ent.sample];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `template_${ent.key}.csv`;
    a.click();
  }

  async function doImport() {
    if (!file) return;
    setLoading(true); setResult(null);
    try {
      const res = await api.bulkImport(entity.key, file);
      setResult({ ok: true, ...res });
    } catch (e) {
      setResult({ ok: false, error: e.message });
    }
    setLoading(false);
    setFile(null);
  }

  const card = { background:'#fff', borderRadius:10, border:'1.5px solid #E0E6EF', padding:20, marginBottom:16 };
  const pill = { fontSize:10, padding:'2px 8px', borderRadius:10, fontWeight:700 };

  return (
    <>
      <div className="ph"><h1>Bulk Import / Export</h1><p>Upload CSV files to add multiple records at once. Download templates below.</p></div>

      {/* Tabs */}
      <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:16}}>
        {ENTITIES.map(e => (
          <button key={e.key} onClick={() => { setTab(e.key); setFile(null); setResult(null); }}
            style={{padding:'6px 14px',borderRadius:20,border:'none',cursor:'pointer',fontWeight:600,fontSize:12,
              background: tab===e.key ? '#0B1E3D' : '#F1F5F9', color: tab===e.key ? '#fff' : '#374151'}}>
            {e.icon} {e.label}
          </button>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
        {/* Upload card */}
        <div style={card}>
          <div style={{fontWeight:700,fontSize:13,marginBottom:12,color:'#0B1E3D'}}>📤 Import {entity.label}</div>

          {/* Required columns info */}
          <div style={{background:'#F8FAFC',borderRadius:8,padding:12,marginBottom:14}}>
            <div style={{fontSize:11,fontWeight:700,color:'#374151',marginBottom:6}}>Required CSV columns:</div>
            <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
              {entity.cols.map((c,i) => (
                <span key={c} style={{...pill, background: i<(entity.key.includes('course')||entity.key==='jobs'?1:3)?'#DBEAFE':'#F1F5F9',
                  color: i<(entity.key.includes('course')||entity.key==='jobs'?1:3)?'#1D4ED8':'#374151'}}>{c}</span>
              ))}
            </div>
            <div style={{fontSize:10,color:'#94A3B8',marginTop:6}}>Blue = required · Grey = optional</div>
          </div>

          {/* Drop zone */}
          <div onDragOver={e=>{e.preventDefault();setDragging(true)}} onDragLeave={()=>setDragging(false)}
            onDrop={e=>{e.preventDefault();setDragging(false);const f=e.dataTransfer.files[0];if(f?.name.endsWith('.csv'))setFile(f);}}
            style={{border:`2px dashed ${dragging?'#0B1E3D':'#CBD5E1'}`,borderRadius:8,padding:28,textAlign:'center',
              background:dragging?'#EFF6FF':'#FAFBFC',cursor:'pointer',marginBottom:12,transition:'all .2s'}}
            onClick={()=>document.getElementById('bulk-file-input').click()}>
            <input id="bulk-file-input" type="file" accept=".csv" style={{display:'none'}}
              onChange={e=>{setFile(e.target.files[0]);e.target.value='';}} />
            <div style={{fontSize:28,marginBottom:6}}>{file ? '✅' : '📁'}</div>
            <div style={{fontSize:12,fontWeight:600,color:'#374151'}}>
              {file ? file.name : 'Drop CSV here or click to browse'}
            </div>
            {!file && <div style={{fontSize:11,color:'#94A3B8',marginTop:4}}>Only .csv files accepted</div>}
          </div>

          <div style={{display:'flex',gap:8}}>
            <button onClick={doImport} disabled={!file||loading}
              style={{flex:1,padding:'10px',borderRadius:8,border:'none',background:file&&!loading?'#007B5E':'#CBD5E1',
                color:'#fff',fontWeight:700,fontSize:13,cursor:file&&!loading?'pointer':'default'}}>
              {loading ? 'Importing…' : `Import ${entity.label}`}
            </button>
            {file && <button onClick={()=>{setFile(null);setResult(null);}}
              style={{padding:'10px 14px',borderRadius:8,border:'1.5px solid #E0E6EF',background:'#fff',cursor:'pointer',fontSize:12}}>
              Clear
            </button>}
          </div>

          {/* Result */}
          {result && (
            <div style={{marginTop:14,borderRadius:8,padding:12,background:result.ok&&result.inserted>0?'#F0FDF4':result.ok?'#FFFBEB':'#FEF2F2',
              border:`1.5px solid ${result.ok&&result.inserted>0?'#86EFAC':result.ok?'#FDE68A':'#FECACA'}`}}>
              {result.ok ? <>
                <div style={{fontWeight:700,fontSize:13,color:result.inserted>0?'#15803D':'#92400E',marginBottom:6}}>
                  {result.inserted > 0 ? `✅ ${result.inserted} of ${result.total_rows} records imported` : `⚠️ 0 records imported (${result.total_rows} rows checked)`}
                </div>
                {result.errors?.length > 0 && <>
                  <div style={{fontSize:11,fontWeight:700,color:'#7F1D1D',marginBottom:4}}>{result.errors.length} row(s) had errors:</div>
                  <div style={{maxHeight:140,overflowY:'auto'}}>
                    {result.errors.map((e,i) => (
                      <div key={i} style={{fontSize:10.5,color:'#7F1D1D',padding:'3px 0',borderBottom:'1px solid #FECACA'}}>
                        Row {e.row}: {e.error}{e.email ? ` (${e.email})` : ''}
                      </div>
                    ))}
                  </div>
                </>}
              </> : <div style={{fontSize:12,color:'#DC2626',fontWeight:600}}>❌ {result.error}</div>}
            </div>
          )}
        </div>

        {/* Template download card */}
        <div style={card}>
          <div style={{fontWeight:700,fontSize:13,marginBottom:12,color:'#0B1E3D'}}>📥 Download Templates</div>
          <div style={{fontSize:12,color:'#6B7FA3',marginBottom:14}}>
            Download a sample CSV with the correct column headers and example data for each entity type.
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {ENTITIES.map(e => (
              <button key={e.key} onClick={() => downloadTemplate(e)}
                style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',borderRadius:8,
                  border:'1.5px solid #E0E6EF',background: e.key===tab ? '#EFF6FF' : '#FAFBFC',
                  cursor:'pointer',textAlign:'left',transition:'background .15s'}}>
                <span style={{fontSize:18}}>{e.icon}</span>
                <div style={{flex:1}}>
                  <div style={{fontWeight:600,fontSize:12,color:'#0B1E3D'}}>{e.label}</div>
                  <div style={{fontSize:10.5,color:'#94A3B8'}}>{e.cols.length} columns · 1 sample row</div>
                </div>
                <span style={{fontSize:11,color:'#3B82F6',fontWeight:700}}>⬇ CSV</span>
              </button>
            ))}
          </div>
        </div>
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
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState({});
  const [stats, setStats] = useState({});

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  useEffect(() => { if (isMobile) setSidebarOpen(false); }, [activeId]); // eslint-disable-line

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
      case 'dashboard': return <PanelDashboard stats={stats} onNavigate={setActiveId} />;
      case 'notifications': return <PanelNotifications stats={stats} />;
      case 'analytics': return <PanelAnalytics stats={stats} />;

      case 'users-all': return <PanelAllUsers />;
      case 'users-candidates': return <PanelUsers key="candidate" role="candidate" title="Candidates / Learners" />;
      case 'users-tp': return <PanelUsers key="training_vendor" role="training_vendor" title="Training Partners" />;
      case 'users-trainers': return <PanelUsers key="trainer" role="trainer" title="Trainers & Assessors" />;
      case 'users-employers': return <PanelUsers key="employer" role="employer" title="Employers" />;
      case 'users-csr': return <PanelUsers key="csr_org" role="csr_org" title="CSR Organizations" />;
      case 'users-placement': return <PanelUsers key="placement_agency" role="placement_agency" title="Placement Agencies" />;
      case 'users-govt': return <PanelUsers key="state_government" role="state_government" title="Government Officials" />;
      case 'roles': return <PanelRoles stats={stats} />;
      case 'bulk-import': return <PanelBulkImport />;

      case 'tp-list':
      case 'tp-verify':
      case 'tp-accred':
      case 'tp-perf': return <PanelTrainingPartners key="tp" subview={activeId} />;

      case 'centers-list':
      case 'centers-audit':
      case 'centers-geo': return <PanelCentres key="centers" subview={activeId} />;

      case 'tr-list':
      case 'tr-assess':
      case 'tr-certs': return <PanelTrainers key="trainers" subview={activeId} />;

      case 'sessions':
      case 'sessions-all':
      case 'sessions-schedule':
      case 'sessions-attendance':
      case 'sessions-content': return <PanelSessions key="sessions" subview={activeId} />;

      case 'course-catalogue':
      case 'course-nsqf':
      case 'course-approve':
      case 'course-upload': return <PanelCourses key="courses" subview={activeId} />;

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

      case 'assess-agencies': return <PanelAssessAgencies />;
      case 'assess-sched': return <PanelAssessScheduled />;
      case 'results': return <PanelComingSoon title="Results & Marks" desc="Assessment results and candidate score records." icon="📊" />;
      case 'certificates': return <PanelComingSoon title="Certificate Generation" desc="Issue and manage skill certificates." icon="📜" />;
      case 'cert-verify': return <PanelComingSoon title="Certificate Verification" desc="Verify candidate certificates by certificate number." icon="🔍" />;
      case 'badges': return <PanelComingSoon title="Digital Badges" desc="Issue verifiable digital badges linked to certifications." icon="🎖️" />;

      case 'jobs': return <PanelJobs />;
      case 'employers': return <PanelUsers key="employer-registry" role="employer" title="Employer Registry" />;
      case 'placements': return <PanelPlacements />;
      case 'place-partners': return <PanelUsers key="placement-partners" role="placement_agency" title="Placement Partners" />;
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
      case 'settings': return <AccountPreferences onLogout={() => { logout(); navigate('/'); }} />;

      default: return <PanelComingSoon title={getLabel(activeId)} desc="This module is under development." />;
    }
  }

  const initials = (user?.name || user?.first_name || 'SA').split(' ').map(p => p[0]).slice(0,2).join('').toUpperCase();

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="sa-wrap">
        {isMobile && sidebarOpen && (
          <div onClick={() => setSidebarOpen(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:199 }} />
        )}
        <aside className="sa-sidebar" style={isMobile ? { position:'fixed', top:0, left:0, height:'100vh', zIndex:200, transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)', transition:'transform 0.25s ease' } : {}}>
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
            {isMobile && (
              <button onClick={() => setSidebarOpen(v => !v)} style={{ width:38, height:38, borderRadius:8, border:'none', background:'#f1f5f9', fontSize:20, cursor:'pointer', flexShrink:0 }}>☰</button>
            )}
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
