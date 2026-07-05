import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

const CSS = `
  .sa-wrap *{box-sizing:border-box;margin:0;padding:0}
  .sa-wrap{font-family:'Inter',system-ui,sans-serif;background:#F4F6F9;color:#1A2B4A;display:flex;height:100vh;overflow:hidden;font-size:13px}

  /* SIDEBAR */
  .sa-sidebar{width:240px;min-width:240px;background:#1A56C4;display:flex;flex-direction:column;height:100vh;overflow:hidden;transition:width .2s;flex-shrink:0}
  .sa-sidebar.collapsed{width:58px;min-width:58px}

  .sa-logo{padding:0 14px;height:56px;display:flex;align-items:center;gap:10px;border-bottom:1px solid rgba(255,255,255,.12);cursor:pointer;flex-shrink:0}
  .sa-logo .mark{width:34px;height:34px;border-radius:8px;background:rgba(255,255,255,.18);display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0}
  .sa-logo .brand{overflow:hidden;white-space:nowrap}
  .sa-logo .brand-name{color:#fff;font-weight:800;font-size:13px;line-height:1.1}
  .sa-logo .brand-tag{color:rgba(255,255,255,.45);font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.1em}

  .sa-nav{flex:1;overflow-y:auto;padding:6px 0}
  .sa-nav::-webkit-scrollbar{width:4px}
  .sa-nav::-webkit-scrollbar-thumb{background:rgba(255,255,255,.2);border-radius:4px}

  .sa-section{padding:10px 14px 3px;color:rgba(255,255,255,.4);font-size:9.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;white-space:nowrap;overflow:hidden}
  .sa-sidebar.collapsed .sa-section{opacity:0;height:0;padding:0}

  .sa-item{display:flex;align-items:center;gap:9px;padding:7px 10px;margin:1px 6px;cursor:pointer;border-radius:6px;color:rgba(255,255,255,.82);font-size:12.5px;font-weight:500;position:relative;transition:background .12s;white-space:nowrap;overflow:hidden;user-select:none}
  .sa-item:hover{background:rgba(255,255,255,.1)}
  .sa-item.active{background:rgba(255,255,255,.22);color:#fff;font-weight:700}
  .sa-item.parent-active{background:rgba(255,255,255,.12);color:#fff}
  .sa-item .sa-icon{font-size:15px;flex-shrink:0;width:20px;text-align:center}
  .sa-item .sa-lbl{flex:1;overflow:hidden;text-overflow:ellipsis}
  .sa-item .sa-chev{font-size:10px;color:rgba(255,255,255,.45);transition:transform .18s;flex-shrink:0}
  .sa-item .sa-badge{background:#DC2626;color:#fff;font-size:9px;font-weight:700;padding:1px 5px;border-radius:10px;flex-shrink:0}
  .sa-item .sa-tag{display:inline-flex;align-items:center;padding:1px 6px;border-radius:4px;font-size:9px;font-weight:700;margin-left:4px}
  .sa-item .sa-tag.new{background:#D1FAE5;color:#065F46}
  .sa-item .sa-tag.soon{background:#FEF3C7;color:#92400E}
  .sa-sidebar.collapsed .sa-item .sa-lbl,.sa-sidebar.collapsed .sa-item .sa-chev,.sa-sidebar.collapsed .sa-item .sa-badge,.sa-sidebar.collapsed .sa-item .sa-tag{display:none}
  .sa-sidebar.collapsed .sa-item{justify-content:center;margin:1px 4px;padding:8px 0}

  .sa-children{overflow:hidden;max-height:0;transition:max-height .28s ease}
  .sa-children.open{max-height:600px}
  .sa-child{display:flex;align-items:center;gap:8px;padding:5px 10px 5px 37px;margin:1px 6px;cursor:pointer;border-radius:5px;color:rgba(255,255,255,.65);font-size:12px;white-space:nowrap;overflow:hidden;transition:background .12s}
  .sa-child:hover{background:rgba(255,255,255,.1);color:#fff}
  .sa-child.active{background:rgba(255,255,255,.18);color:#fff;font-weight:600}
  .sa-sidebar.collapsed .sa-children{display:none}

  .sa-footer{padding:10px 12px;border-top:1px solid rgba(255,255,255,.12);display:flex;align-items:center;gap:9px;flex-shrink:0}
  .sa-avatar{width:30px;height:30px;border-radius:50%;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;font-weight:700;flex-shrink:0}
  .sa-footer .sa-uname{color:rgba(255,255,255,.9);font-size:11px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .sa-footer .sa-urole{color:rgba(255,255,255,.42);font-size:9.5px;text-transform:capitalize}
  .sa-sidebar.collapsed .sa-footer .sa-uname,.sa-sidebar.collapsed .sa-footer .sa-urole{display:none}
  .sa-sidebar.collapsed .sa-footer{justify-content:center;padding:10px 0}

  /* TOGGLE BTN */
  .sa-toggle-btn{position:fixed;bottom:20px;background:#1A56C4;color:#fff;border:none;border-radius:50%;width:28px;height:28px;cursor:pointer;font-size:12px;transition:left .2s;z-index:200;box-shadow:0 2px 8px rgba(0,0,0,.2);display:flex;align-items:center;justify-content:center}

  /* MAIN */
  .sa-main{flex:1;display:flex;flex-direction:column;overflow:hidden;min-width:0}

  .sa-topbar{height:56px;background:#fff;border-bottom:1px solid #E0E6EF;display:flex;align-items:center;padding:0 22px;gap:14px;flex-shrink:0;box-shadow:0 1px 4px rgba(10,45,110,.05)}
  .sa-topbar .sa-breadcrumb{flex:1;display:flex;align-items:baseline;gap:6px}
  .sa-topbar .sa-tb-section{font-size:11px;color:#6B7FA3;font-weight:500}
  .sa-topbar .sa-tb-title{font-size:15px;font-weight:800;color:#003366}
  .sa-topbar .sa-actions{display:flex;align-items:center;gap:10px}
  .sa-topbar .sa-badge-notif{background:#FEE2E2;color:#DC2626;font-size:10px;font-weight:700;padding:2px 8px;border-radius:12px}
  .sa-topbar .sa-user-info{display:flex;align-items:center;gap:7px}
  .sa-topbar .sa-av{width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#003366,#1A56C4);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:11px}
  .sa-topbar .sa-tb-uname{font-size:12px;font-weight:700;color:#1A2B4A}
  .sa-topbar .sa-tb-urole{font-size:10px;color:#6B7FA3;text-transform:capitalize}
  .sa-signout-btn{padding:5px 14px;border-radius:7px;border:1px solid #E0E6EF;background:#fff;color:#3D5170;font-size:11.5px;font-weight:600;cursor:pointer}
  .sa-signout-btn:hover{border-color:#1A56C4;color:#1A56C4}

  .sa-content{flex:1;overflow-y:auto;padding:22px}

  /* PANEL CONTENT STYLES */
  .sa-content .page-header{margin-bottom:18px}
  .sa-content .page-header h1{font-size:20px;font-weight:800;color:#003366;margin-bottom:3px}
  .sa-content .page-header p{font-size:12px;color:#6B7FA3}

  .sa-content .kpi-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-bottom:18px}
  .sa-content .kpi{background:#fff;border:1px solid #E0E6EF;border-radius:10px;padding:14px 16px;border-top:3px solid var(--c)}
  .sa-content .kpi .val{font-size:26px;font-weight:800;color:var(--c);line-height:1}
  .sa-content .kpi .lbl{font-size:11px;color:#3D5170;font-weight:600;margin-top:5px}
  .sa-content .kpi .sub{font-size:10px;color:var(--c);font-weight:700;margin-top:3px}

  .sa-content .grid2{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px}
  .sa-content .grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:14px}

  .sa-content .card{background:#fff;border:1px solid #E0E6EF;border-radius:10px;padding:16px}
  .sa-content .card-title{font-size:11px;font-weight:700;color:#6B7FA3;text-transform:uppercase;letter-spacing:.5px;margin-bottom:12px;display:flex;align-items:center;gap:6px}

  .sa-content table{width:100%;border-collapse:collapse;font-size:12px}
  .sa-content thead tr{background:#1A56C4}
  .sa-content thead th{padding:9px 12px;color:rgba(255,255,255,.85);font-weight:700;text-align:left;font-size:11px}
  .sa-content tbody tr{border-bottom:1px solid #F1F5F9}
  .sa-content tbody tr:hover{background:#F8FAFC}
  .sa-content tbody td{padding:9px 12px;color:#1A2B4A}

  .sa-content .pill{display:inline-flex;align-items:center;padding:2px 9px;border-radius:20px;font-size:10.5px;font-weight:700}
  .sa-content .pill.green{background:#D1FAE5;color:#065F46}
  .sa-content .pill.amber{background:#FEF3C7;color:#92400E}
  .sa-content .pill.red{background:#FEE2E2;color:#991B1B}
  .sa-content .pill.blue{background:#DBEAFE;color:#1E40AF}
  .sa-content .pill.gray{background:#F1F5F9;color:#475569}
  .sa-content .pill.purple{background:#EDE9FE;color:#5B21B6}

  .sa-content .stat-row{display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid #F1F5F9}
  .sa-content .stat-row:last-child{border:none}
  .sa-content .stat-row .lbl{font-size:12px;color:#3D5170}
  .sa-content .stat-row .val{font-size:13px;font-weight:700;color:#003366}

  .sa-content .prog-bar{height:6px;background:#E0E6EF;border-radius:3px;margin-top:4px;overflow:hidden}
  .sa-content .prog-fill{height:100%;border-radius:3px}

  .sa-content .action-btn{display:inline-flex;align-items:center;gap:5px;padding:7px 14px;border-radius:7px;border:none;font-size:12px;font-weight:700;cursor:pointer}
  .sa-content .action-btn:hover{opacity:.85}
  .sa-content .btn-primary{background:#1A56C4;color:#fff}
  .sa-content .btn-teal{background:#007B5E;color:#fff}
  .sa-content .btn-outline{background:#fff;color:#003366;border:1.5px solid #E0E6EF}
  .sa-content .btn-danger{background:#DC2626;color:#fff}

  .sa-content input[type=text],.sa-content input[type=date],.sa-content select{padding:6px 10px;border:1px solid #E0E6EF;border-radius:6px;font-size:12px;outline:none;font-family:inherit}
  .sa-content input[type=text]:focus,.sa-content input[type=date]:focus,.sa-content select:focus{border-color:#1A56C4}
`;

const NAV = [
  {
    section: 'MAIN',
    items: [
      { id: 'dashboard', icon: '🏠', label: 'Dashboard' },
      { id: 'notifications', icon: '🔔', label: 'Notifications', badge: 5 },
      { id: 'analytics', icon: '📈', label: 'Live Analytics', tag: 'New', tagType: 'new' },
    ],
  },
  {
    section: 'USER MANAGEMENT',
    items: [
      {
        id: 'users-all', icon: '👥', label: 'All Users', children: [
          { id: 'users-candidates', label: 'Candidates / Learners' },
          { id: 'users-tp', label: 'Training Partners' },
          { id: 'users-trainers', label: 'Trainers & Assessors' },
          { id: 'users-employers', label: 'Employers' },
          { id: 'users-csr', label: 'CSR Organizations' },
          { id: 'users-placement', label: 'Placement Agencies' },
          { id: 'users-govt', label: 'Government Officials' },
        ],
      },
      { id: 'roles', icon: '🔑', label: 'Roles & Permissions' },
      { id: 'bulk-import', icon: '📥', label: 'Bulk Import / Export' },
    ],
  },
  {
    section: 'TRAINING ECOSYSTEM',
    items: [
      {
        id: 'tp-registry', icon: '🏫', label: 'Training Partners', children: [
          { id: 'tp-list', label: 'Partner Registry' },
          { id: 'tp-verify', label: 'Verification Queue' },
          { id: 'tp-accred', label: 'Accreditation Status' },
          { id: 'tp-perf', label: 'Performance Dashboard' },
        ],
      },
      {
        id: 'centers', icon: '📍', label: 'Training Centers', children: [
          { id: 'centers-list', label: 'Center Registry' },
          { id: 'centers-audit', label: 'Infrastructure Audit' },
          { id: 'centers-geo', label: 'Geo-Mapping' },
        ],
      },
      {
        id: 'trainers', icon: '👨‍🏫', label: 'Trainers & Assessors', children: [
          { id: 'tr-list', label: 'Trainer Registry' },
          { id: 'tr-assess', label: 'Assessor Registry' },
          { id: 'tr-certs', label: 'Certifications & Badges' },
        ],
      },
    ],
  },
  {
    section: 'COURSES & CURRICULUM',
    items: [
      {
        id: 'courses', icon: '📚', label: 'Courses', children: [
          { id: 'course-catalogue', label: 'Course Catalogue' },
          { id: 'course-nsqf', label: 'NSQF Framework' },
          { id: 'course-approve', label: 'Approval Queue' },
          { id: 'course-upload', label: 'Curriculum Upload' },
        ],
      },
      { id: 'sectors', icon: '🏭', label: 'Sectors & Job Roles' },
    ],
  },
  {
    section: 'SCHEMES & PROGRAMS',
    items: [
      { id: 'pmkvy', icon: '🇮🇳', label: 'PMKVY 4.0' },
      { id: 'ddugky', icon: '🌾', label: 'DDU-GKY' },
      { id: 'naps', icon: '🔧', label: 'NAPS (Apprenticeship)' },
      { id: 'state-skill', icon: '🏛️', label: 'State Skill Missions' },
      { id: 'csr-prog', icon: '🤝', label: 'CSR-Funded Programs' },
      { id: 'fee-prog', icon: '💰', label: 'Fee-Based Programs' },
      { id: 'scheme-config', icon: '⚙️', label: 'Scheme Configuration' },
    ],
  },
  {
    section: 'CANDIDATES & ENROLMENT',
    items: [
      { id: 'candidate-reg', icon: '👤', label: 'Candidate Registry' },
      { id: 'enrolments', icon: '📋', label: 'Enrolments' },
      { id: 'batches', icon: '📅', label: 'Batch Management' },
      { id: 'attendance', icon: '✅', label: 'Attendance' },
      { id: 'dropout', icon: '⚠️', label: 'Dropout Management' },
      { id: 'target-ben', icon: '🎯', label: 'Target Beneficiaries' },
    ],
  },
  {
    section: 'ASSESSMENTS & CERTIFICATIONS',
    items: [
      { id: 'assess-agencies', icon: '🏅', label: 'Assessment Agencies' },
      { id: 'assess-sched', icon: '📆', label: 'Scheduled Assessments' },
      { id: 'results', icon: '📊', label: 'Results & Marks' },
      { id: 'certificates', icon: '📜', label: 'Certificate Generation' },
      { id: 'cert-verify', icon: '🔍', label: 'Certificate Verification' },
      { id: 'badges', icon: '🎖️', label: 'Digital Badges', tag: 'Soon', tagType: 'soon' },
    ],
  },
  {
    section: 'PLACEMENTS & EMPLOYMENT',
    items: [
      { id: 'jobs', icon: '💼', label: 'Job Marketplace' },
      { id: 'employers', icon: '🏢', label: 'Employer Registry' },
      { id: 'placements', icon: '🎯', label: 'Placement Records' },
      { id: 'place-partners', icon: '🤝', label: 'Placement Partners' },
      { id: 'emp-verify', icon: '✔️', label: 'Employment Verification' },
      { id: 'apprentice', icon: '🔧', label: 'Apprenticeship Portal' },
    ],
  },
  {
    section: 'FINANCIAL MANAGEMENT',
    items: [
      { id: 'fund-alloc', icon: '💵', label: 'Fund Allocation' },
      { id: 'disbursements', icon: '🏦', label: 'Disbursements' },
      { id: 'claims', icon: '📄', label: 'Training Cost Claims' },
      { id: 'scheme-budget', icon: '📊', label: 'Scheme-wise Budgets' },
      { id: 'fin-audit', icon: '🔎', label: 'Audit & Compliance' },
      { id: 'pay-reports', icon: '📑', label: 'Payment Reports' },
    ],
  },
  {
    section: 'REPORTS & ANALYTICS',
    items: [
      { id: 'mis', icon: '📊', label: 'MIS Dashboard' },
      { id: 'sector-rpt', icon: '🏭', label: 'Sector-wise Reports' },
      { id: 'state-rpt', icon: '🗺️', label: 'State-wise Reports' },
      { id: 'scheme-rpt', icon: '📋', label: 'Scheme Reports' },
      { id: 'place-analytics', icon: '📈', label: 'Placement Analytics' },
      { id: 'export', icon: '📤', label: 'Export Centre' },
      { id: 'custom-rpt', icon: '🛠️', label: 'Custom Report Builder', tag: 'New', tagType: 'new' },
    ],
  },
  {
    section: 'GEOGRAPHIC COVERAGE',
    items: [
      { id: 'geo-states', icon: '🗺️', label: 'States & Districts' },
      { id: 'geo-aspire', icon: '⭐', label: 'Aspirational Districts' },
      { id: 'geo-block', icon: '📌', label: 'Block-level Mapping' },
      { id: 'geo-rural', icon: '🌾', label: 'Rural / Urban Coverage' },
    ],
  },
  {
    section: 'CONTENT & COMMUNICATION',
    items: [
      { id: 'announce', icon: '📢', label: 'Announcements' },
      { id: 'push-notif', icon: '🔔', label: 'Push Notifications' },
      { id: 'email-tpl', icon: '✉️', label: 'Email Templates' },
      { id: 'faq', icon: '❓', label: 'FAQs & Help Centre' },
      { id: 'doc-lib', icon: '📁', label: 'Document Library' },
    ],
  },
  {
    section: 'SETUP & CONFIGURATION',
    items: [
      { id: 'setup-sectors', icon: '🏭', label: 'Sectors & Categories' },
      { id: 'setup-jobroles', icon: '👔', label: 'Job Roles (NSQF)' },
      { id: 'setup-accred', icon: '🏅', label: 'Accreditation Types' },
      { id: 'setup-orgclass', icon: '🏢', label: 'Organisation Classifications' },
      { id: 'setup-skills', icon: '💡', label: 'Skills Database' },
      { id: 'setup-schemes', icon: '📜', label: 'Government Schemes' },
      { id: 'audit-logs', icon: '📋', label: 'Audit Logs' },
      { id: 'sys-settings', icon: '⚙️', label: 'System Settings' },
      { id: 'api-config', icon: '🔗', label: 'API Configuration' },
    ],
  },
];

function getPanelHtml(id, navFlat) {
  const item = navFlat.find(i => i.id === id);
  const label = item?.label || id;

  const panels = {
    dashboard: `
      <div class="page-header"><h1>Platform Overview</h1><p>SkillsNJobs · Real-time data · Skills India aligned</p></div>
      <div class="kpi-grid">
        <div class="kpi" style="--c:#1A56C4"><div class="val">1,24,820</div><div class="lbl">Total Learners</div><div class="sub">↑ 3,240 this month</div></div>
        <div class="kpi" style="--c:#007B5E"><div class="val">2,340</div><div class="lbl">Training Partners</div><div class="sub">↑ 38 verified</div></div>
        <div class="kpi" style="--c:#7C3AED"><div class="val">8,910</div><div class="lbl">Trainers & Assessors</div><div class="sub">↑ 124 certified</div></div>
        <div class="kpi" style="--c:#F4A900"><div class="val">61,204</div><div class="lbl">Certifications Issued</div><div class="sub">↑ 1,890 this week</div></div>
        <div class="kpi" style="--c:#DC2626"><div class="val">43,180</div><div class="lbl">Placed Candidates</div><div class="sub">↑ 67% placement rate</div></div>
        <div class="kpi" style="--c:#0891B2"><div class="val">4,280</div><div class="lbl">Employer Partners</div><div class="sub">↑ 12,400 open jobs</div></div>
      </div>
      <div class="grid2">
        <div class="card">
          <div class="card-title">📊 Platform KPIs</div>
          ${[['Placement Rate','67%','#007B5E',67],['Certification Rate','82%','#1A56C4',82],['Dropout Rate','8%','#DC2626',8],['Course Completion','74%','#7C3AED',74],['Employer Satisfaction','91%','#007B5E',91]].map(([l,v,c,p])=>`
            <div style="margin-bottom:10px">
              <div style="display:flex;justify-content:space-between;margin-bottom:3px">
                <span style="font-size:12px;color:#3D5170">${l}</span>
                <span style="font-size:12px;font-weight:700;color:${c}">${v}</span>
              </div>
              <div class="prog-bar"><div class="prog-fill" style="width:${p}%;background:${c}"></div></div>
            </div>`).join('')}
        </div>
        <div class="card">
          <div class="card-title">⚡ Quick Actions</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
            ${[['➕ Add Training Partner','btn-primary'],['📥 Bulk Import Users','btn-outline'],['📜 Generate MIS Report','btn-teal'],['🔍 Verify Certificates','btn-outline'],['💵 Process Disbursement','btn-teal'],['📢 Send Announcement','btn-outline']].map(([l,c])=>`<button class="action-btn ${c}" style="font-size:11px;padding:8px 10px">${l}</button>`).join('')}
          </div>
        </div>
      </div>
      <div class="grid2">
        <div class="card">
          <div class="card-title">🏛️ Scheme-wise Enrolments</div>
          <table><thead><tr><th>Scheme</th><th>Enrolled</th><th>Certified</th><th>Placed</th><th>Status</th></tr></thead>
          <tbody>${[['PMKVY 4.0','48,240','38,120','29,800'],['DDU-GKY','22,180','17,440','14,200'],['NAPS','18,900','14,200','13,100'],['State Skill Mission','21,300','16,800','10,900'],['CSR Programs','8,200','6,440','4,820'],['Fee-Based','6,000','5,200','2,980']].map(([s,e,c,p])=>`<tr><td style="font-weight:600">${s}</td><td>${e}</td><td>${c}</td><td>${p}</td><td><span class="pill green">active</span></td></tr>`).join('')}</tbody></table>
        </div>
        <div class="card">
          <div class="card-title">🕐 Recent Activity</div>
          ${[['🏫','WilFlex Software Solutions onboarded','2 min ago','blue'],['📜','3,420 certificates issued — PMKVY batch','8 min ago','green'],['⚠️','4 training partners pending verification','14 min ago','amber'],['💰','₹2.4 Cr disbursed to 18 TPs','1 hr ago','green'],['👤','280 new candidates registered today','2 hr ago','blue'],['🔍','Certificate fraud alert — UP region','3 hr ago','red'],['📊','Monthly MIS report generated','5 hr ago','gray'],['✅','NSDC sector alignment updated','6 hr ago','green']].map(([ic,t,time,col])=>`
            <div style="display:flex;gap:10px;padding:7px 0;border-bottom:1px solid #F1F5F9;align-items:flex-start">
              <div style="font-size:14px;margin-top:1px">${ic}</div>
              <div style="flex:1"><div style="font-size:11.5px;color:#1A2B4A">${t}</div><div style="font-size:10px;color:#6B7FA3;margin-top:2px">${time}</div></div>
              <span class="pill ${col}" style="font-size:9px">•</span>
            </div>`).join('')}
        </div>
      </div>`,

    'tp-list': `
      <div class="page-header"><h1>Training Partner Registry</h1><p>All registered training partners — verified, pending, and suspended</p></div>
      <div class="kpi-grid">
        <div class="kpi" style="--c:#1A56C4"><div class="val">2,340</div><div class="lbl">Total Partners</div></div>
        <div class="kpi" style="--c:#007B5E"><div class="val">1,980</div><div class="lbl">Verified</div></div>
        <div class="kpi" style="--c:#F4A900"><div class="val">280</div><div class="lbl">Pending Verification</div></div>
        <div class="kpi" style="--c:#DC2626"><div class="val">80</div><div class="lbl">Suspended</div></div>
      </div>
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <div class="card-title" style="margin:0">Training Partners</div>
          <div style="display:flex;gap:8px">
            <input type="text" placeholder="Search partner..." style="width:200px">
            <button class="action-btn btn-primary">+ Add Partner</button>
            <button class="action-btn btn-outline">📥 Import</button>
          </div>
        </div>
        <table><thead><tr><th>Organisation</th><th>Type</th><th>State</th><th>NSDC Code</th><th>Centers</th><th>Trainees</th><th>Accreditation</th><th>Status</th><th>Action</th></tr></thead>
        <tbody>${[['WiiFlex Software Solutions','Private Ltd','Telangana','NSDC-TP-24810',3,420,'ISO 9001','Verified'],['SkillUp India Foundation','NGO / Trust','Maharashtra','NSDC-TP-18230',8,1240,'NABL','Verified'],['TechLearn Academy','Partnership','Karnataka','NSDC-TP-29100',5,680,'ISO 9001','Verified'],['Rural Skill Dev Society','Society','Rajasthan','NSDC-TP-11820',12,2180,'NSDC Direct','Verified'],['FutureTech Institute','Section 8','Gujarat','Pending',2,0,'Pending','Pending'],['Udyam Skill Centre','LLP','UP','Pending',1,0,'Pending','Pending']].map(([n,t,st,c,cn,tr,ac,s])=>`
          <tr>
            <td style="font-weight:600;color:#003366">${n}</td>
            <td><span class="pill gray">${t}</span></td><td>${st}</td>
            <td style="font-size:11px;color:#6B7FA3">${c}</td>
            <td style="text-align:center">${cn}</td><td style="text-align:center">${Number(tr).toLocaleString()}</td>
            <td><span class="pill ${ac==='Pending'?'amber':'green'}">${ac}</span></td>
            <td><span class="pill ${s==='Verified'?'green':'amber'}">${s}</span></td>
            <td><button class="action-btn btn-outline" style="font-size:10px;padding:4px 9px">View</button></td>
          </tr>`).join('')}</tbody></table>
      </div>`,

    'users-candidates': `
      <div class="page-header"><h1>Candidate / Learner Registry</h1><p>All registered learners across schemes and states</p></div>
      <div class="kpi-grid">
        <div class="kpi" style="--c:#1A56C4"><div class="val">1,24,820</div><div class="lbl">Total Candidates</div></div>
        <div class="kpi" style="--c:#007B5E"><div class="val">61,204</div><div class="lbl">Certified</div></div>
        <div class="kpi" style="--c:#F4A900"><div class="val">43,180</div><div class="lbl">Placed</div></div>
        <div class="kpi" style="--c:#DC2626"><div class="val">9,840</div><div class="lbl">Dropouts</div></div>
      </div>
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <div class="card-title" style="margin:0">Learner Registry</div>
          <div style="display:flex;gap:8px">
            <select><option>All Schemes</option><option>PMKVY 4.0</option><option>DDU-GKY</option><option>NAPS</option></select>
            <select><option>All States</option><option>Telangana</option><option>Maharashtra</option><option>UP</option></select>
            <button class="action-btn btn-teal">📤 Export</button>
          </div>
        </div>
        <table><thead><tr><th>Candidate ID</th><th>Name</th><th>State</th><th>Scheme</th><th>Course</th><th>Batch</th><th>Status</th><th>Placement</th></tr></thead>
        <tbody>${[['SKL-24-001821','Priya Sharma','Telangana','PMKVY 4.0','Digital Marketing','B-2024-Q1','Certified','Placed'],['SKL-24-001822','Ravi Kumar','Maharashtra','DDU-GKY','Construction Tech','B-2024-Q1','In Training','—'],['SKL-24-001823','Sunita Devi','UP','PMKVY 4.0','Healthcare Assistant','B-2024-Q2','Assessed','Pending'],['SKL-24-001824','Mohammed Ali','Gujarat','NAPS','Electrical Tech','B-2024-Q1','Certified','Placed'],['SKL-24-001825','Kavya Reddy','Telangana','Fee-Based','IT Support','B-2024-Q2','In Training','—']].map(([id,n,st,sc,co,b,s,pl])=>`
          <tr>
            <td style="font-size:11px;color:#6B7FA3">${id}</td>
            <td style="font-weight:600">${n}</td><td>${st}</td>
            <td><span class="pill blue" style="font-size:9px">${sc}</span></td>
            <td>${co}</td><td style="font-size:11px">${b}</td>
            <td><span class="pill ${s==='Certified'?'green':s==='In Training'?'blue':'amber'}">${s}</span></td>
            <td><span class="pill ${pl==='Placed'?'green':pl==='Pending'?'amber':'gray'}">${pl}</span></td>
          </tr>`).join('')}</tbody></table>
      </div>`,

    certificates: `
      <div class="page-header"><h1>Certificate Generation & Verification</h1><p>Generate, track and verify NSQF-aligned skill certificates</p></div>
      <div class="kpi-grid">
        <div class="kpi" style="--c:#007B5E"><div class="val">61,204</div><div class="lbl">Total Issued</div></div>
        <div class="kpi" style="--c:#1A56C4"><div class="val">3,420</div><div class="lbl">This Month</div></div>
        <div class="kpi" style="--c:#7C3AED"><div class="val">18,240</div><div class="lbl">Verified by Employers</div></div>
        <div class="kpi" style="--c:#DC2626"><div class="val">42</div><div class="lbl">Fraud Alerts</div></div>
      </div>
      <div class="grid2">
        <div class="card">
          <div class="card-title">📜 Recent Certificates</div>
          <table><thead><tr><th>Cert ID</th><th>Candidate</th><th>Course</th><th>NSQF</th><th>Date</th><th>Status</th></tr></thead>
          <tbody>${[['CERT-2024-001821','Priya Sharma','Digital Marketing','L4','Dec 2024','Valid'],['CERT-2024-001820','Mohammed Ali','Electrical Tech','L3','Dec 2024','Valid'],['CERT-2024-001819','Riya Patel','Healthcare Asst.','L4','Nov 2024','Valid'],['CERT-2024-001818','Arun Sinha','Construction','L2','Nov 2024','Flagged']].map(([id,n,c,l,d,s])=>`
            <tr>
              <td style="font-size:10px;color:#6B7FA3">${id}</td>
              <td style="font-weight:600;font-size:11.5px">${n}</td>
              <td style="font-size:11px">${c}</td>
              <td><span class="pill blue">${l}</span></td>
              <td style="font-size:11px">${d}</td>
              <td><span class="pill ${s==='Valid'?'green':'red'}">${s}</span></td>
            </tr>`).join('')}</tbody></table>
        </div>
        <div class="card">
          <div class="card-title">🔍 Verify Certificate</div>
          <div style="padding:10px 0">
            <label style="font-size:11px;font-weight:700;color:#3D5170;display:block;margin-bottom:5px">Certificate ID or QR Code</label>
            <input type="text" placeholder="Enter CERT-YYYY-XXXXXX" style="width:100%;margin-bottom:10px">
            <button class="action-btn btn-primary" style="width:100%;justify-content:center">🔍 Verify Certificate</button>
            <div style="margin-top:14px;padding:12px;background:#F0FDF4;border:1px solid #BBF7D0;border-radius:8px">
              <div style="font-size:11px;font-weight:700;color:#065F46;margin-bottom:6px">✅ Certificate Valid</div>
              <div class="stat-row"><span class="lbl">Candidate</span><span class="val">Priya Sharma</span></div>
              <div class="stat-row"><span class="lbl">Course</span><span class="val">Digital Marketing L4</span></div>
              <div class="stat-row"><span class="lbl">Issued by</span><span class="val">WiiFlex Software Solutions</span></div>
              <div class="stat-row"><span class="lbl">Issue Date</span><span class="val">15 Dec 2024</span></div>
              <div class="stat-row"><span class="lbl">Assessment Agency</span><span class="val">Wheebox</span></div>
            </div>
          </div>
        </div>
      </div>`,

    mis: `
      <div class="page-header"><h1>MIS Dashboard</h1><p>Management Information System — real-time platform metrics</p></div>
      <div class="grid3">
        <div class="card"><div class="card-title">Sector-wise Enrolments</div><div style="font-size:11.5px;color:#3D5170">IT / ITeS leads with 28,400 learners</div><button class="action-btn btn-outline" style="margin-top:10px;font-size:11px">View Details</button></div>
        <div class="card"><div class="card-title">State-wise Coverage</div><div style="font-size:11.5px;color:#3D5170">24 states active, 8 aspirational districts</div></div>
        <div class="card"><div class="card-title">Monthly Progress</div><div style="font-size:11.5px;color:#3D5170">3,240 new enrolments in December</div></div>
      </div>
      <div class="grid2">
        <div class="card">
          <div class="card-title">📊 Sector-wise Breakdown</div>
          ${[['IT / ITeS',28400,'#1A56C4',42],['Healthcare',18200,'#007B5E',27],['Construction',12800,'#F4A900',19],['Logistics',9400,'#7C3AED',14],['Retail',8100,'#DC2626',12],['Agriculture',6200,'#0891B2',9],['Beauty & Wellness',4800,'#007B5E',7]].map(([s,v,c,p])=>`
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:9px">
              <div style="width:100px;font-size:11.5px;color:#3D5170;flex-shrink:0">${s}</div>
              <div style="flex:1"><div class="prog-bar"><div class="prog-fill" style="width:${p*2}%;background:${c}"></div></div></div>
              <div style="width:52px;font-size:11px;font-weight:700;color:${c};text-align:right">${Number(v).toLocaleString()}</div>
            </div>`).join('')}
        </div>
        <div class="card">
          <div class="card-title">📋 Export Reports</div>
          ${[['MIS Monthly Report','Dec 2024','PDF / Excel'],['Scheme-wise Report','Q3 FY2024-25','Excel'],['State Coverage Report','Dec 2024','PDF'],['Placement Analytics','Nov 2024','Excel'],['Trainer Performance','Dec 2024','PDF / Excel'],['Financial Summary','Q3 FY2024-25','PDF']].map(([n,p,f])=>`
            <div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid #F1F5F9">
              <div style="flex:1"><div style="font-size:12px;font-weight:600;color:#1A2B4A">${n}</div><div style="font-size:10px;color:#6B7FA3">${p} · ${f}</div></div>
              <button class="action-btn btn-outline" style="font-size:10px;padding:4px 9px">📥 Download</button>
            </div>`).join('')}
        </div>
      </div>`,

    pmkvy: `
      <div class="page-header"><h1>PMKVY 4.0 — Management</h1><p>Pradhan Mantri Kaushal Vikas Yojana 4.0 — scheme administration</p></div>
      <div class="kpi-grid">
        <div class="kpi" style="--c:#003366"><div class="val">48,240</div><div class="lbl">Total Enrolled</div></div>
        <div class="kpi" style="--c:#007B5E"><div class="val">38,120</div><div class="lbl">Certified</div></div>
        <div class="kpi" style="--c:#F4A900"><div class="val">29,800</div><div class="lbl">Placed</div></div>
        <div class="kpi" style="--c:#1A56C4"><div class="val">₹84.2 Cr</div><div class="lbl">Funds Disbursed</div></div>
      </div>
      <div class="grid2">
        <div class="card">
          <div class="card-title">🏛️ Component-wise Progress</div>
          ${[['Short-term Training (STT)','28,400 enrolled','#1A56C4',70],['Recognition of Prior Learning (RPL)','11,800 enrolled','#007B5E',45],['Special Projects','4,200 enrolled','#7C3AED',30],['Kaushal from Abroad','3,840 enrolled','#F4A900',28]].map(([l,s,c,p])=>`
            <div style="margin-bottom:12px">
              <div style="display:flex;justify-content:space-between;margin-bottom:4px">
                <span style="font-size:12px;font-weight:600;color:#1A2B4A">${l}</span>
                <span style="font-size:11px;color:${c};font-weight:700">${p}%</span>
              </div>
              <div style="font-size:10.5px;color:#6B7FA3;margin-bottom:4px">${s}</div>
              <div class="prog-bar"><div class="prog-fill" style="width:${p}%;background:${c}"></div></div>
            </div>`).join('')}
        </div>
        <div class="card">
          <div class="card-title">💵 Financial Summary</div>
          ${[['Total Budget Allocated','₹124.0 Cr'],['Disbursed to TPs','₹84.2 Cr'],['Pending Disbursement','₹22.4 Cr'],['Under Audit','₹17.4 Cr'],['Avg. Cost per Trainee','₹12,400'],['Utilisation Rate','68%']].map(([l,v])=>`<div class="stat-row"><span class="lbl">${l}</span><span class="val">${v}</span></div>`).join('')}
        </div>
      </div>`,

    'audit-logs': `
      <div class="page-header"><h1>Audit Logs</h1><p>Complete platform activity trail for compliance and governance</p></div>
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <div class="card-title" style="margin:0">Activity Log</div>
          <div style="display:flex;gap:8px">
            <select><option>All Events</option><option>Login</option><option>Data Change</option><option>System</option></select>
            <input type="date">
            <button class="action-btn btn-teal">📤 Export</button>
          </div>
        </div>
        <table><thead><tr><th>Timestamp</th><th>User</th><th>Role</th><th>Event</th><th>Entity</th><th>IP Address</th><th>Status</th></tr></thead>
        <tbody>${[['04 Jan 2025 09:42:18','admin@skills.gov.in','Superadmin','Scheme Updated','PMKVY Budget','49.204.82.1','Success'],['04 Jan 2025 09:38:44','tp@wiiflex.com','Training Partner','Profile Submitted','TP Registration','106.213.14.2','Success'],['04 Jan 2025 09:30:11','admin@skills.gov.in','Superadmin','User Bulk Import','1,200 Candidates','49.204.82.1','Success'],['04 Jan 2025 09:12:55','unknown','—','Login Failed','—','185.220.101.4','Failed'],['04 Jan 2025 08:58:20','mis@skills.gov.in','Admin','Report Generated','MIS Dec 2024','49.204.82.8','Success'],['04 Jan 2025 08:44:10','admin@skills.gov.in','Superadmin','Certificate Issued','Batch B-2024-Q4','49.204.82.1','Success']].map(([t,u,r,e,en,ip,s])=>`
          <tr>
            <td style="font-size:10.5px;color:#6B7FA3;white-space:nowrap">${t}</td>
            <td style="font-size:11.5px">${u}</td>
            <td><span class="pill ${r==='Superadmin'?'purple':r==='Admin'?'blue':'gray'}" style="font-size:9px">${r}</span></td>
            <td style="font-size:12px">${e}</td>
            <td style="font-size:11px;color:#3D5170">${en}</td>
            <td style="font-size:10.5px;color:#6B7FA3">${ip}</td>
            <td><span class="pill ${s==='Success'?'green':'red'}">${s}</span></td>
          </tr>`).join('')}</tbody></table>
      </div>`,

    analytics: `
      <div class="page-header"><h1>Live Analytics</h1><p>Real-time platform activity — auto-refreshes every 60 seconds</p></div>
      <div class="kpi-grid">
        <div class="kpi" style="--c:#1A56C4"><div class="val">847</div><div class="lbl">Active Users Now</div><div class="sub">↑ 12 in last 5 min</div></div>
        <div class="kpi" style="--c:#007B5E"><div class="val">124</div><div class="lbl">Enrolments Today</div><div class="sub">↑ 18 since midnight</div></div>
        <div class="kpi" style="--c:#7C3AED"><div class="val">38</div><div class="lbl">Certificates Today</div><div class="sub">PMKVY batch</div></div>
        <div class="kpi" style="--c:#F4A900"><div class="val">6</div><div class="lbl">Pending Verifications</div><div class="sub">Avg wait: 2.4 hrs</div></div>
        <div class="kpi" style="--c:#DC2626"><div class="val">2</div><div class="lbl">Fraud Alerts</div><div class="sub">Requires action</div></div>
        <div class="kpi" style="--c:#0891B2"><div class="val">₹18.4L</div><div class="lbl">Disbursed Today</div><div class="sub">4 transactions</div></div>
      </div>
      <div class="grid2">
        <div class="card">
          <div class="card-title">📈 Hourly Enrolments (Today)</div>
          <div style="display:flex;align-items:flex-end;gap:6px;height:120px;padding-top:10px">
            ${[18,24,31,42,38,52,47,61,58,72,68,80,74,82,78,90,86,94,88,96,92,84,76,68].map((v,i)=>`
              <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:3px">
                <div style="width:100%;background:#1A56C4;border-radius:3px 3px 0 0;height:${v/96*100}%;opacity:${i===23?1:.7};transition:.3s"></div>
                ${i%4===0?`<div style="font-size:8px;color:#94A3B8">${i}h</div>`:''}
              </div>`).join('')}
          </div>
        </div>
        <div class="card">
          <div class="card-title">🌐 Active Users by Role</div>
          ${[['Candidates / Learners',480,'#1A56C4',57],['Training Partners',142,'#007B5E',17],['Trainers & Assessors',98,'#7C3AED',12],['Employers',76,'#F4A900',9],['Placement Agencies',32,'#DC2626',4],['Admins / Officers',19,'#0891B2',2]].map(([r,v,c,p])=>`
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:9px">
              <div style="width:140px;font-size:11.5px;color:#3D5170;flex-shrink:0">${r}</div>
              <div style="flex:1"><div class="prog-bar"><div class="prog-fill" style="width:${p*1.6}%;background:${c}"></div></div></div>
              <div style="font-size:11px;font-weight:700;color:${c};width:30px;text-align:right">${v}</div>
            </div>`).join('')}
        </div>
      </div>
      <div class="grid3">
        <div class="card">
          <div class="card-title">📋 Top Active States</div>
          ${[['Telangana',182,'#1A56C4'],['Maharashtra',164,'#007B5E'],['Uttar Pradesh',128,'#7C3AED'],['Karnataka',98,'#F4A900'],['Gujarat',82,'#DC2626'],['Rajasthan',74,'#0891B2']].map(([s,v,c],i)=>`
            <div class="stat-row">
              <span class="lbl">${i+1}. ${s}</span>
              <span style="font-size:13px;font-weight:700;color:${c}">${v}</span>
            </div>`).join('')}
        </div>
        <div class="card">
          <div class="card-title">🏭 Top Active Sectors</div>
          ${[['IT / ITeS',312,'#1A56C4'],['Healthcare',186,'#007B5E'],['Construction',142,'#7C3AED'],['Logistics',98,'#F4A900'],['Retail',72,'#DC2626'],['Agriculture',37,'#0891B2']].map(([s,v,c],i)=>`
            <div class="stat-row">
              <span class="lbl">${i+1}. ${s}</span>
              <span style="font-size:13px;font-weight:700;color:${c}">${v}</span>
            </div>`).join('')}
        </div>
        <div class="card">
          <div class="card-title">⚡ Live Event Feed</div>
          ${[['👤','New candidate registered','2s ago','blue'],['📜','Certificate issued — PMKVY','18s ago','green'],['🏫','TP verification submitted','41s ago','amber'],['💵','Disbursement processed','1m ago','green'],['🔍','Certificate verified by employer','2m ago','blue'],['⚠️','Login failure — 3 attempts','4m ago','red']].map(([ic,t,time,col])=>`
            <div style="display:flex;gap:8px;padding:5px 0;border-bottom:1px solid #F1F5F9;align-items:flex-start">
              <div style="font-size:13px">${ic}</div>
              <div style="flex:1"><div style="font-size:11px;color:#1A2B4A">${t}</div><div style="font-size:9.5px;color:#94A3B8">${time}</div></div>
              <span class="pill ${col}" style="font-size:8px">•</span>
            </div>`).join('')}
        </div>
      </div>`,

    notifications: `
      <div class="page-header"><h1>Notifications</h1><p>System alerts, approvals and platform activity</p></div>
      <div class="kpi-grid">
        <div class="kpi" style="--c:#DC2626"><div class="val">5</div><div class="lbl">Urgent Alerts</div></div>
        <div class="kpi" style="--c:#F4A900"><div class="val">18</div><div class="lbl">Pending Approvals</div></div>
        <div class="kpi" style="--c:#1A56C4"><div class="val">42</div><div class="lbl">Unread</div></div>
        <div class="kpi" style="--c:#007B5E"><div class="val">124</div><div class="lbl">This Week</div></div>
      </div>
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <div class="card-title" style="margin:0">All Notifications</div>
          <div style="display:flex;gap:8px">
            <select><option>All Types</option><option>Alerts</option><option>Approvals</option><option>System</option></select>
            <button class="action-btn btn-outline">✓ Mark All Read</button>
          </div>
        </div>
        ${[['🔴','Fraud Alert','Certificate forgery detected — UP region. Candidate: SKL-24-009182','2 min ago','red','Urgent'],['🟠','TP Verification Pending','WilFlex Software Solutions awaiting accreditation review','8 min ago','amber','Approval'],['🔵','Bulk Import Complete','1,200 candidates imported from PMKVY batch file','15 min ago','blue','Info'],['🔵','MIS Report Ready','December 2024 MIS report has been generated and is ready to download','1 hr ago','blue','Info'],['🟢','Disbursement Processed','₹2.4 Cr released to 18 training partners','2 hr ago','green','Finance'],['🔴','Login Anomaly','Multiple failed logins detected from IP 185.220.101.4','3 hr ago','red','Security'],['🟠','Scheme Target Alert','PMKVY Q3 target at 68% — intervention required','5 hr ago','amber','Scheme'],['🟢','New TP Onboarded','TechLearn Academy Bangalore verified and active','6 hr ago','green','Info']].map(([ic,title,msg,time,col,tag])=>`
          <div style="display:flex;gap:12px;padding:12px 0;border-bottom:1px solid #F1F5F9;align-items:flex-start">
            <div style="font-size:18px;margin-top:2px">${ic}</div>
            <div style="flex:1">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:3px">
                <span style="font-size:12.5px;font-weight:700;color:#1A2B4A">${title}</span>
                <span class="pill ${col}" style="font-size:9px">${tag}</span>
              </div>
              <div style="font-size:11.5px;color:#3D5170">${msg}</div>
              <div style="font-size:10px;color:#94A3B8;margin-top:3px">${time}</div>
            </div>
            <button class="action-btn btn-outline" style="font-size:10px;padding:4px 9px;flex-shrink:0">View</button>
          </div>`).join('')}
      </div>`,

    'users-all': `
      <div class="page-header"><h1>All Users</h1><p>Complete user registry across all roles and states</p></div>
      <div class="kpi-grid">
        <div class="kpi" style="--c:#1A56C4"><div class="val">1,38,420</div><div class="lbl">Total Users</div></div>
        <div class="kpi" style="--c:#007B5E"><div class="val">1,24,820</div><div class="lbl">Active</div></div>
        <div class="kpi" style="--c:#F4A900"><div class="val">8,240</div><div class="lbl">Pending Approval</div></div>
        <div class="kpi" style="--c:#DC2626"><div class="val">5,360</div><div class="lbl">Suspended</div></div>
      </div>
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <div class="card-title" style="margin:0">User Registry</div>
          <div style="display:flex;gap:8px">
            <input type="text" placeholder="Search user...">
            <select><option>All Roles</option><option>Candidate</option><option>Training Partner</option><option>Trainer</option><option>Employer</option></select>
            <button class="action-btn btn-primary">+ Add User</button>
          </div>
        </div>
        <table><thead><tr><th>User ID</th><th>Name</th><th>Email</th><th>Role</th><th>State</th><th>Joined</th><th>Status</th><th>Action</th></tr></thead>
        <tbody>${[['USR-001','Priya Sharma','priya@email.com','Candidate','Telangana','Jan 2024','Active'],['USR-002','WiiFlex Pvt Ltd','admin@wiiflex.com','Training Partner','Telangana','Mar 2024','Active'],['USR-003','Ramesh Gupta','rgupta@trainer.in','Trainer','UP','Feb 2024','Active'],['USR-004','Infosys HR','hr@infosys.com','Employer','Karnataka','Jan 2024','Active'],['USR-005','CSR Foundation','csr@ngo.in','CSR Org','Maharashtra','Apr 2024','Pending']].map(([id,n,e,r,st,j,s])=>`
          <tr>
            <td style="font-size:10.5px;color:#6B7FA3">${id}</td>
            <td style="font-weight:600">${n}</td>
            <td style="font-size:11px">${e}</td>
            <td><span class="pill blue" style="font-size:9px">${r}</span></td>
            <td>${st}</td>
            <td style="font-size:11px">${j}</td>
            <td><span class="pill ${s==='Active'?'green':'amber'}">${s}</span></td>
            <td><button class="action-btn btn-outline" style="font-size:10px;padding:4px 9px">View</button></td>
          </tr>`).join('')}
        </tbody></table>
      </div>`,

    'users-tp': `
      <div class="page-header"><h1>Training Partners</h1><p>All registered training partner organisations</p></div>
      <div class="kpi-grid">
        <div class="kpi" style="--c:#1A56C4"><div class="val">2,340</div><div class="lbl">Total TPs</div></div>
        <div class="kpi" style="--c:#007B5E"><div class="val">1,980</div><div class="lbl">Verified</div></div>
        <div class="kpi" style="--c:#F4A900"><div class="val">280</div><div class="lbl">Pending</div></div>
        <div class="kpi" style="--c:#DC2626"><div class="val">80</div><div class="lbl">Suspended</div></div>
      </div>
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <div class="card-title" style="margin:0">Training Partner Accounts</div>
          <div style="display:flex;gap:8px">
            <input type="text" placeholder="Search...">
            <button class="action-btn btn-primary">+ Add TP</button>
            <button class="action-btn btn-teal">📤 Export</button>
          </div>
        </div>
        <table><thead><tr><th>Organisation</th><th>Type</th><th>State</th><th>NSDC Code</th><th>Email</th><th>Centers</th><th>Status</th><th>Action</th></tr></thead>
        <tbody>${[['WiiFlex Software Solutions','Private Ltd','Telangana','NSDC-TP-24810','admin@wiiflex.com',3,'Verified'],['SkillUp India Foundation','NGO','Maharashtra','NSDC-TP-18230','info@skillup.org',8,'Verified'],['TechLearn Academy','Partnership','Karnataka','NSDC-TP-29100','tp@techlearn.in',5,'Verified'],['Rural Skill Dev Society','Society','Rajasthan','NSDC-TP-11820','rsd@society.in',12,'Verified'],['FutureTech Institute','Section 8','Gujarat','Pending','admin@futuretech.in',2,'Pending']].map(([n,t,st,c,e,cn,s])=>`
          <tr>
            <td style="font-weight:600;color:#003366">${n}</td>
            <td><span class="pill gray" style="font-size:9px">${t}</span></td>
            <td>${st}</td>
            <td style="font-size:10.5px;color:#6B7FA3">${c}</td>
            <td style="font-size:11px">${e}</td>
            <td style="text-align:center">${cn}</td>
            <td><span class="pill ${s==='Verified'?'green':'amber'}">${s}</span></td>
            <td><button class="action-btn btn-outline" style="font-size:10px;padding:4px 9px">View</button></td>
          </tr>`).join('')}
        </tbody></table>
      </div>`,

    'users-trainers': `
      <div class="page-header"><h1>Trainers & Assessors</h1><p>All certified trainers and assessment professionals</p></div>
      <div class="kpi-grid">
        <div class="kpi" style="--c:#7C3AED"><div class="val">8,910</div><div class="lbl">Total Trainers</div></div>
        <div class="kpi" style="--c:#007B5E"><div class="val">2,840</div><div class="lbl">Assessors</div></div>
        <div class="kpi" style="--c:#1A56C4"><div class="val">6,240</div><div class="lbl">Certified</div></div>
        <div class="kpi" style="--c:#F4A900"><div class="val">480</div><div class="lbl">Renewal Due</div></div>
      </div>
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <div class="card-title" style="margin:0">Trainer / Assessor Registry</div>
          <div style="display:flex;gap:8px">
            <input type="text" placeholder="Search trainer...">
            <select><option>All Sectors</option><option>IT/ITeS</option><option>Healthcare</option><option>Construction</option></select>
            <button class="action-btn btn-teal">📤 Export</button>
          </div>
        </div>
        <table><thead><tr><th>Trainer ID</th><th>Name</th><th>Sector</th><th>Partner</th><th>State</th><th>Certified</th><th>Rating</th><th>Status</th></tr></thead>
        <tbody>${[['TR-001','Ramesh Gupta','IT / ITeS','WiiFlex Pvt Ltd','Telangana','Yes','4.8/5','Active'],['TR-002','Sunita Patel','Healthcare','SkillUp India','Maharashtra','Yes','4.6/5','Active'],['TR-003','Arun Yadav','Construction','Rural Skill Dev','Rajasthan','Yes','4.4/5','Active'],['TR-004','Meena Sharma','Retail','TechLearn Academy','Karnataka','No','—','Pending'],['TR-005','Vijay Kumar','Logistics','FutureTech','Gujarat','Yes','4.2/5','Active']].map(([id,n,sec,tp,st,cert,rat,s])=>`
          <tr>
            <td style="font-size:10.5px;color:#6B7FA3">${id}</td>
            <td style="font-weight:600">${n}</td>
            <td>${sec}</td>
            <td style="font-size:11px">${tp}</td>
            <td>${st}</td>
            <td><span class="pill ${cert==='Yes'?'green':'amber'}">${cert}</span></td>
            <td style="font-weight:700;color:#007B5E">${rat}</td>
            <td><span class="pill ${s==='Active'?'green':'amber'}">${s}</span></td>
          </tr>`).join('')}
        </tbody></table>
      </div>`,

    'users-employers': `
      <div class="page-header"><h1>Employer Registry</h1><p>All registered employer organisations on the platform</p></div>
      <div class="kpi-grid">
        <div class="kpi" style="--c:#0891B2"><div class="val">4,280</div><div class="lbl">Total Employers</div></div>
        <div class="kpi" style="--c:#007B5E"><div class="val">12,400</div><div class="lbl">Open Jobs</div></div>
        <div class="kpi" style="--c:#1A56C4"><div class="val">43,180</div><div class="lbl">Hires via Platform</div></div>
        <div class="kpi" style="--c:#F4A900"><div class="val">320</div><div class="lbl">Pending Verification</div></div>
      </div>
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <div class="card-title" style="margin:0">Employer Accounts</div>
          <div style="display:flex;gap:8px">
            <input type="text" placeholder="Search employer...">
            <select><option>All Sectors</option><option>IT</option><option>Manufacturing</option><option>Healthcare</option></select>
            <button class="action-btn btn-teal">📤 Export</button>
          </div>
        </div>
        <table><thead><tr><th>Company</th><th>Sector</th><th>State</th><th>Open Jobs</th><th>Total Hires</th><th>Status</th><th>Action</th></tr></thead>
        <tbody>${[['Infosys Ltd','IT / ITeS','Karnataka',124,1840,'Verified'],['Apollo Hospitals','Healthcare','Tamil Nadu',48,620,'Verified'],['Larsen & Toubro','Construction','Maharashtra',82,940,'Verified'],['Amazon India','Logistics','Telangana',210,2400,'Verified'],['Reliance Retail','Retail','Gujarat',96,1120,'Verified'],['TCS BPS','IT / ITeS','UP',88,760,'Verified']].map(([c,sec,st,oj,th,s])=>`
          <tr>
            <td style="font-weight:600;color:#003366">${c}</td>
            <td>${sec}</td>
            <td>${st}</td>
            <td style="text-align:center;color:#1A56C4;font-weight:700">${oj}</td>
            <td style="text-align:center;font-weight:700">${Number(th).toLocaleString()}</td>
            <td><span class="pill green">${s}</span></td>
            <td><button class="action-btn btn-outline" style="font-size:10px;padding:4px 9px">View</button></td>
          </tr>`).join('')}
        </tbody></table>
      </div>`,

    'users-csr': `
      <div class="page-header"><h1>CSR Organizations</h1><p>Corporate Social Responsibility partners funding skill programs</p></div>
      <div class="kpi-grid">
        <div class="kpi" style="--c:#007B5E"><div class="val">284</div><div class="lbl">CSR Partners</div></div>
        <div class="kpi" style="--c:#1A56C4"><div class="val">₹48.2 Cr</div><div class="lbl">Total CSR Funds</div></div>
        <div class="kpi" style="--c:#7C3AED"><div class="val">8,200</div><div class="lbl">Beneficiaries</div></div>
        <div class="kpi" style="--c:#F4A900"><div class="val">42</div><div class="lbl">Active Programs</div></div>
      </div>
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <div class="card-title" style="margin:0">CSR Partner Registry</div>
          <div style="display:flex;gap:8px">
            <input type="text" placeholder="Search organisation...">
            <button class="action-btn btn-teal">📤 Export</button>
          </div>
        </div>
        <table><thead><tr><th>Organisation</th><th>Sector Focus</th><th>Fund Committed</th><th>Beneficiaries</th><th>Programs</th><th>Status</th><th>Action</th></tr></thead>
        <tbody>${[['Tata CSR Foundation','IT & Agri','₹12.4 Cr',2400,8,'Active'],['Wipro Cares','STEM / Healthcare','₹8.8 Cr',1800,5,'Active'],['HCL Foundation','Rural Skills','₹6.2 Cr',1240,6,'Active'],['Infosys Foundation','Women Empowerment','₹9.4 Cr',1600,7,'Active'],['HDFC Bank CSR','Financial Literacy','₹4.8 Cr',680,4,'Active'],['Mahindra Rise','Agri & Manufacturing','₹6.6 Cr',1480,12,'Active']].map(([o,s,f,b,p,st])=>`
          <tr>
            <td style="font-weight:600;color:#003366">${o}</td>
            <td>${s}</td>
            <td style="font-weight:700;color:#007B5E">${f}</td>
            <td style="text-align:center">${Number(b).toLocaleString()}</td>
            <td style="text-align:center">${p}</td>
            <td><span class="pill green">${st}</span></td>
            <td><button class="action-btn btn-outline" style="font-size:10px;padding:4px 9px">View</button></td>
          </tr>`).join('')}
        </tbody></table>
      </div>`,

    'users-placement': `
      <div class="page-header"><h1>Placement Agencies</h1><p>Registered placement partners and staffing agencies</p></div>
      <div class="kpi-grid">
        <div class="kpi" style="--c:#1A56C4"><div class="val">480</div><div class="lbl">Agencies</div></div>
        <div class="kpi" style="--c:#007B5E"><div class="val">43,180</div><div class="lbl">Placements Made</div></div>
        <div class="kpi" style="--c:#7C3AED"><div class="val">8,400</div><div class="lbl">Active Openings</div></div>
        <div class="kpi" style="--c:#F4A900"><div class="val">38</div><div class="lbl">Pending Verification</div></div>
      </div>
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <div class="card-title" style="margin:0">Placement Agency Registry</div>
          <div style="display:flex;gap:8px">
            <input type="text" placeholder="Search agency...">
            <button class="action-btn btn-teal">📤 Export</button>
          </div>
        </div>
        <table><thead><tr><th>Agency</th><th>Sector Focus</th><th>State</th><th>Placements</th><th>Openings</th><th>Rating</th><th>Status</th><th>Action</th></tr></thead>
        <tbody>${[['TeamLease Services','Multi-sector','Karnataka',4800,320,'4.6/5','Active'],['Randstad India','IT & BPO','Maharashtra',3200,240,'4.4/5','Active'],['Mafoi Management','Manufacturing','Tamil Nadu',2800,180,'4.2/5','Active'],['Quess Corp','Retail & Logistics','Telangana',3600,280,'4.5/5','Active'],['IKYA Human Capital','Healthcare','Delhi',2100,160,'4.3/5','Active']].map(([a,s,st,pl,op,rat,status])=>`
          <tr>
            <td style="font-weight:600;color:#003366">${a}</td>
            <td>${s}</td>
            <td>${st}</td>
            <td style="text-align:center;font-weight:700">${Number(pl).toLocaleString()}</td>
            <td style="text-align:center;color:#1A56C4;font-weight:700">${op}</td>
            <td style="font-weight:700;color:#007B5E">${rat}</td>
            <td><span class="pill green">${status}</span></td>
            <td><button class="action-btn btn-outline" style="font-size:10px;padding:4px 9px">View</button></td>
          </tr>`).join('')}
        </tbody></table>
      </div>`,

    'users-govt': `
      <div class="page-header"><h1>Government Officials</h1><p>State and central government user accounts with platform access</p></div>
      <div class="kpi-grid">
        <div class="kpi" style="--c:#003366"><div class="val">184</div><div class="lbl">Govt Users</div></div>
        <div class="kpi" style="--c:#1A56C4"><div class="val">28</div><div class="lbl">State Officers</div></div>
        <div class="kpi" style="--c:#007B5E"><div class="val">12</div><div class="lbl">Central Ministry</div></div>
        <div class="kpi" style="--c:#7C3AED"><div class="val">144</div><div class="lbl">District Officers</div></div>
      </div>
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <div class="card-title" style="margin:0">Government User Registry</div>
          <div style="display:flex;gap:8px">
            <input type="text" placeholder="Search official...">
            <select><option>All Levels</option><option>Central</option><option>State</option><option>District</option></select>
            <button class="action-btn btn-teal">📤 Export</button>
          </div>
        </div>
        <table><thead><tr><th>Name</th><th>Designation</th><th>Ministry / Dept</th><th>Level</th><th>Access Level</th><th>Status</th></tr></thead>
        <tbody>${[['Shri R.K. Sharma','Joint Secretary','Ministry of Skill Development','Central','Full MIS Access','Active'],['Ms. Priya Verma','Director, Skill Mission','State Skill Dev. Mission','State','State Reports','Active'],['Shri A. Patel','District Collector','District Admin, Surat','District','District View','Active'],['Dr. M. Rao','DET Commissioner','Dept of Employment & Training','State','State Reports','Active'],['Shri S. Kumar','Programme Officer','Ministry of Rural Development','Central','DDU-GKY Reports','Active']].map(([n,d,m,l,ac,s])=>`
          <tr>
            <td style="font-weight:600">${n}</td>
            <td style="font-size:11px">${d}</td>
            <td style="font-size:11px">${m}</td>
            <td><span class="pill ${l==='Central'?'purple':l==='State'?'blue':'gray'}" style="font-size:9px">${l}</span></td>
            <td style="font-size:11px;color:#3D5170">${ac}</td>
            <td><span class="pill green">${s}</span></td>
          </tr>`).join('')}
        </tbody></table>
      </div>`,

    'bulk-import': `
      <div class="page-header"><h1>Bulk Import / Export</h1><p>Upload or download platform data in bulk using CSV or Excel templates</p></div>
      <div class="grid2">
        <div class="card">
          <div class="card-title">📥 Bulk Import</div>
          ${[['Candidates','Upload candidate registration data','CSV / Excel'],['Training Partners','Onboard multiple TPs at once','CSV / Excel'],['Trainers','Add multiple trainers','CSV'],['Courses','Upload course catalogue','Excel'],['Enrolments','Batch enrolment records','CSV']].map(([t,d,f])=>`
            <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid #F1F5F9">
              <div style="flex:1">
                <div style="font-size:12px;font-weight:700;color:#1A2B4A">${t}</div>
                <div style="font-size:11px;color:#6B7FA3">${d} · ${f}</div>
              </div>
              <button class="action-btn btn-outline" style="font-size:10px;padding:4px 9px">📋 Template</button>
              <button class="action-btn btn-primary" style="font-size:10px;padding:4px 9px">📥 Upload</button>
            </div>`).join('')}
        </div>
        <div class="card">
          <div class="card-title">📤 Bulk Export</div>
          ${[['All Candidates','Full candidate registry with status','CSV / Excel'],['Placement Records','Placed candidate details','Excel'],['Financial Summary','Disbursements and claims','Excel / PDF'],['MIS Report','Platform-wide MIS data','PDF / Excel'],['Scheme Progress','Scheme-wise enrolment data','Excel']].map(([t,d,f])=>`
            <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid #F1F5F9">
              <div style="flex:1">
                <div style="font-size:12px;font-weight:700;color:#1A2B4A">${t}</div>
                <div style="font-size:11px;color:#6B7FA3">${d} · ${f}</div>
              </div>
              <button class="action-btn btn-teal" style="font-size:10px;padding:4px 9px">📤 Export</button>
            </div>`).join('')}
          <div style="margin-top:12px;padding:10px 12px;background:#F0FDF4;border:1px solid #BBF7D0;border-radius:8px;font-size:11.5px;color:#065F46">Last export: Dec 2024 MIS · 3.2 MB · Generated 2 hrs ago</div>
        </div>
      </div>`,

    'tp-verify': `
      <div class="page-header"><h1>Verification Queue</h1><p>Training partner applications pending review and approval</p></div>
      <div class="kpi-grid">
        <div class="kpi" style="--c:#F4A900"><div class="val">280</div><div class="lbl">Pending Verification</div></div>
        <div class="kpi" style="--c:#1A56C4"><div class="val">48</div><div class="lbl">Under Review</div></div>
        <div class="kpi" style="--c:#007B5E"><div class="val">1,980</div><div class="lbl">Approved Total</div></div>
        <div class="kpi" style="--c:#DC2626"><div class="val">24</div><div class="lbl">Rejected This Month</div></div>
      </div>
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <div class="card-title" style="margin:0">Pending Applications</div>
          <div style="display:flex;gap:8px">
            <select><option>All States</option><option>Telangana</option><option>UP</option><option>Gujarat</option></select>
            <button class="action-btn btn-teal">📤 Export</button>
          </div>
        </div>
        <table><thead><tr><th>Organisation</th><th>Type</th><th>State</th><th>Applied</th><th>Documents</th><th>Priority</th><th>Action</th></tr></thead>
        <tbody>${[['FutureTech Institute','Section 8','Gujarat','28 Dec 2024','4/5 Uploaded','Normal'],['Udyam Skill Centre','LLP','UP','27 Dec 2024','3/5 Uploaded','High'],['Green Skills Pvt Ltd','Private Ltd','Rajasthan','26 Dec 2024','5/5 Uploaded','Normal'],['Disha Foundation','NGO / Trust','MP','25 Dec 2024','2/5 Uploaded','Low'],['Prerna Skill Centre','Society','Bihar','24 Dec 2024','4/5 Uploaded','High']].map(([n,t,st,a,d,p])=>`
          <tr>
            <td style="font-weight:600;color:#003366">${n}</td>
            <td><span class="pill gray" style="font-size:9px">${t}</span></td>
            <td>${st}</td>
            <td style="font-size:11px">${a}</td>
            <td><span class="pill ${d.startsWith('5')?'green':'amber'}">${d}</span></td>
            <td><span class="pill ${p==='High'?'red':p==='Normal'?'blue':'gray'}">${p}</span></td>
            <td>
              <div style="display:flex;gap:4px">
                <button class="action-btn btn-teal" style="font-size:10px;padding:3px 8px">✓ Approve</button>
                <button class="action-btn btn-danger" style="font-size:10px;padding:3px 8px">✗ Reject</button>
              </div>
            </td>
          </tr>`).join('')}
        </tbody></table>
      </div>`,

    'tp-accred': `
      <div class="page-header"><h1>Accreditation Status</h1><p>Training partner accreditation types and renewal tracking</p></div>
      <div class="kpi-grid">
        <div class="kpi" style="--c:#007B5E"><div class="val">1,840</div><div class="lbl">ISO 9001 Certified</div></div>
        <div class="kpi" style="--c:#1A56C4"><div class="val">420</div><div class="lbl">NABL Accredited</div></div>
        <div class="kpi" style="--c:#7C3AED"><div class="val">280</div><div class="lbl">NSDC Direct</div></div>
        <div class="kpi" style="--c:#F4A900"><div class="val">148</div><div class="lbl">Renewal Due (90 days)</div></div>
      </div>
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <div class="card-title" style="margin:0">Accreditation Registry</div>
          <div style="display:flex;gap:8px">
            <select><option>All Types</option><option>ISO 9001</option><option>NABL</option><option>NSDC Direct</option></select>
            <button class="action-btn btn-teal">📤 Export</button>
          </div>
        </div>
        <table><thead><tr><th>Partner</th><th>Accreditation Type</th><th>Issued By</th><th>Valid From</th><th>Valid Until</th><th>Status</th></tr></thead>
        <tbody>${[['WiiFlex Software Solutions','ISO 9001:2015','Bureau Veritas','Jan 2023','Jan 2026','Valid'],['SkillUp India Foundation','NABL Accredited','NABL','Mar 2022','Mar 2025','Expiring Soon'],['TechLearn Academy','NSDC Direct Empanelment','NSDC','Apr 2023','Apr 2026','Valid'],['Rural Skill Dev Society','ISO 9001:2015','TÜV SÜD','Jun 2021','Jun 2024','Expired'],['Udyam Skill Centre','State Accreditation','TSSDC','Aug 2023','Aug 2025','Valid']].map(([p,a,ib,vf,vu,s])=>`
          <tr>
            <td style="font-weight:600">${p}</td>
            <td>${a}</td>
            <td style="font-size:11px">${ib}</td>
            <td style="font-size:11px">${vf}</td>
            <td style="font-size:11px">${vu}</td>
            <td><span class="pill ${s==='Valid'?'green':s==='Expiring Soon'?'amber':'red'}">${s}</span></td>
          </tr>`).join('')}
        </tbody></table>
      </div>`,

    'tp-perf': `
      <div class="page-header"><h1>Performance Dashboard</h1><p>Training partner quality scores and performance metrics</p></div>
      <div class="kpi-grid">
        <div class="kpi" style="--c:#007B5E"><div class="val">4.6/5</div><div class="lbl">Avg Platform Rating</div></div>
        <div class="kpi" style="--c:#1A56C4"><div class="val">82%</div><div class="lbl">Avg Certification Rate</div></div>
        <div class="kpi" style="--c:#7C3AED"><div class="val">67%</div><div class="lbl">Avg Placement Rate</div></div>
        <div class="kpi" style="--c:#DC2626"><div class="val">8%</div><div class="lbl">Avg Dropout Rate</div></div>
      </div>
      <div class="card">
        <div class="card-title">🏆 Partner Performance Leaderboard</div>
        <table><thead><tr><th>Rank</th><th>Partner</th><th>Trainees</th><th>Cert Rate</th><th>Placement</th><th>Dropout</th><th>Rating</th><th>Grade</th></tr></thead>
        <tbody>${[['#1','SkillUp India Foundation','1,240','94%','78%','4%','4.8/5','A+'],['#2','WiiFlex Software Solutions','420','91%','82%','5%','4.7/5','A+'],['#3','TechLearn Academy','680','88%','74%','6%','4.6/5','A'],['#4','Rural Skill Dev Society','2,180','84%','61%','9%','4.2/5','B+'],['#5','FutureTech Institute','—','—','—','—','—','Pending']].map(([r,p,tr,cr,pl,dr,rat,g])=>`
          <tr>
            <td style="font-weight:800;color:#1A56C4">${r}</td>
            <td style="font-weight:600">${p}</td>
            <td style="text-align:center">${tr}</td>
            <td style="font-weight:700;color:#007B5E">${cr}</td>
            <td style="font-weight:700;color:#1A56C4">${pl}</td>
            <td style="font-weight:700;color:#DC2626">${dr}</td>
            <td style="font-weight:700;color:#007B5E">${rat}</td>
            <td><span class="pill ${g==='A+'?'green':g==='A'?'blue':g==='B+'?'amber':'gray'}">${g}</span></td>
          </tr>`).join('')}
        </tbody></table>
      </div>`,

    'centers-list': `
      <div class="page-header"><h1>Center Registry</h1><p>All registered training centers across the country</p></div>
      <div class="kpi-grid">
        <div class="kpi" style="--c:#1A56C4"><div class="val">6,840</div><div class="lbl">Total Centers</div></div>
        <div class="kpi" style="--c:#007B5E"><div class="val">5,920</div><div class="lbl">Active</div></div>
        <div class="kpi" style="--c:#F4A900"><div class="val">620</div><div class="lbl">Pending Inspection</div></div>
        <div class="kpi" style="--c:#DC2626"><div class="val">300</div><div class="lbl">Suspended</div></div>
      </div>
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <div class="card-title" style="margin:0">Training Centers</div>
          <div style="display:flex;gap:8px">
            <input type="text" placeholder="Search center...">
            <select><option>All States</option><option>Telangana</option><option>Maharashtra</option><option>UP</option></select>
            <button class="action-btn btn-teal">📤 Export</button>
          </div>
        </div>
        <table><thead><tr><th>Center Name</th><th>Partner</th><th>State</th><th>District</th><th>Capacity</th><th>Batches</th><th>Status</th></tr></thead>
        <tbody>${[['WiiFlex Hyderabad Centre','WiiFlex Software Solutions','Telangana','Hyderabad',60,4,'Active'],['SkillUp Pune Centre','SkillUp India Foundation','Maharashtra','Pune',80,6,'Active'],['TechLearn Bangalore','TechLearn Academy','Karnataka','Bangalore',50,3,'Active'],['Rural Dev Jaipur','Rural Skill Dev Society','Rajasthan','Jaipur',40,5,'Active'],['Udyam Lucknow','Udyam Skill Centre','UP','Lucknow',30,0,'Pending'],['FutureTech Surat','FutureTech Institute','Gujarat','Surat',45,2,'Active']].map(([cn,p,st,d,cap,b,s])=>`
          <tr>
            <td style="font-weight:600;color:#003366">${cn}</td>
            <td style="font-size:11px">${p}</td>
            <td>${st}</td>
            <td>${d}</td>
            <td style="text-align:center">${cap}</td>
            <td style="text-align:center;font-weight:700;color:#1A56C4">${b}</td>
            <td><span class="pill ${s==='Active'?'green':'amber'}">${s}</span></td>
          </tr>`).join('')}
        </tbody></table>
      </div>`,

    'centers-audit': `
      <div class="page-header"><h1>Infrastructure Audit</h1><p>Center inspection reports and compliance status</p></div>
      <div class="kpi-grid">
        <div class="kpi" style="--c:#007B5E"><div class="val">4,820</div><div class="lbl">Inspected</div></div>
        <div class="kpi" style="--c:#F4A900"><div class="val">620</div><div class="lbl">Pending Inspection</div></div>
        <div class="kpi" style="--c:#DC2626"><div class="val">148</div><div class="lbl">Non-Compliant</div></div>
        <div class="kpi" style="--c:#1A56C4"><div class="val">92%</div><div class="lbl">Compliance Rate</div></div>
      </div>
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <div class="card-title" style="margin:0">Audit Reports</div>
          <div style="display:flex;gap:8px">
            <select><option>All Results</option><option>Compliant</option><option>Non-Compliant</option><option>Pending</option></select>
            <input type="date">
            <button class="action-btn btn-teal">📤 Export</button>
          </div>
        </div>
        <table><thead><tr><th>Center</th><th>State</th><th>Auditor</th><th>Audit Date</th><th>Score</th><th>Classrooms</th><th>Equipment</th><th>Result</th></tr></thead>
        <tbody>${[['WiiFlex Hyderabad','Telangana','NSDC Inspector','15 Dec 2024','94/100','✅','✅','Compliant'],['SkillUp Pune','Maharashtra','State Inspector','12 Dec 2024','88/100','✅','✅','Compliant'],['Rural Dev Jaipur','Rajasthan','NSDC Inspector','10 Dec 2024','62/100','⚠️','❌','Non-Compliant'],['TechLearn Bangalore','Karnataka','State Inspector','8 Dec 2024','91/100','✅','✅','Compliant'],['FutureTech Surat','Gujarat','—','—','—','—','—','Pending']].map(([c,st,au,d,sc,cl,eq,r])=>`
          <tr>
            <td style="font-weight:600">${c}</td>
            <td>${st}</td>
            <td style="font-size:11px">${au}</td>
            <td style="font-size:11px">${d}</td>
            <td style="font-weight:700;color:${sc.startsWith('9')?'#007B5E':sc.startsWith('8')?'#1A56C4':sc==='—'?'#94A3B8':'#DC2626'}">${sc}</td>
            <td style="text-align:center">${cl}</td>
            <td style="text-align:center">${eq}</td>
            <td><span class="pill ${r==='Compliant'?'green':r==='Non-Compliant'?'red':'amber'}">${r}</span></td>
          </tr>`).join('')}
        </tbody></table>
      </div>`,

    'centers-geo': `
      <div class="page-header"><h1>Geo-Mapping</h1><p>Geographic distribution of training centers across India</p></div>
      <div class="kpi-grid">
        <div class="kpi" style="--c:#1A56C4"><div class="val">28</div><div class="lbl">States Covered</div></div>
        <div class="kpi" style="--c:#007B5E"><div class="val">312</div><div class="lbl">Districts Covered</div></div>
        <div class="kpi" style="--c:#F4A900"><div class="val">8</div><div class="lbl">Aspirational Districts</div></div>
        <div class="kpi" style="--c:#DC2626"><div class="val">124</div><div class="lbl">Uncovered Districts</div></div>
      </div>
      <div class="grid2">
        <div class="card">
          <div class="card-title">🗺️ State-wise Center Count</div>
          ${[['Uttar Pradesh',820,'#1A56C4',82],['Maharashtra',640,'#007B5E',64],['Rajasthan',520,'#7C3AED',52],['Telangana',480,'#F4A900',48],['Karnataka',420,'#DC2626',42],['Gujarat',380,'#0891B2',38],['Bihar',280,'#007B5E',28],['Madhya Pradesh',240,'#1A56C4',24]].map(([s,v,c,p])=>`
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:9px">
              <div style="width:120px;font-size:11.5px;color:#3D5170;flex-shrink:0">${s}</div>
              <div style="flex:1"><div class="prog-bar"><div class="prog-fill" style="width:${p}%;background:${c}"></div></div></div>
              <div style="font-size:11px;font-weight:700;color:${c};width:40px;text-align:right">${v}</div>
            </div>`).join('')}
        </div>
        <div class="card">
          <div class="card-title">⭐ Aspirational Districts Coverage</div>
          <table><thead><tr><th>District</th><th>State</th><th>Centers</th><th>Trainees</th><th>Coverage</th></tr></thead>
          <tbody>${[['Shrawasti','UP',2,180,'Low'],['Bahraich','UP',3,240,'Medium'],['Gajapati','Odisha',1,80,'Low'],['Malkangiri','Odisha',2,140,'Medium'],['Chitrakoot','UP',1,60,'Low'],['Noney','Manipur',1,40,'Low']].map(([d,st,c,tr,cov])=>`
            <tr>
              <td style="font-weight:600">${d}</td>
              <td>${st}</td>
              <td style="text-align:center">${c}</td>
              <td style="text-align:center">${tr}</td>
              <td><span class="pill ${cov==='Low'?'red':'amber'}">${cov}</span></td>
            </tr>`).join('')}
          </tbody></table>
        </div>
      </div>`,

    'tr-list': `
      <div class="page-header"><h1>Trainer Registry</h1><p>All certified trainers across sectors and states</p></div>
      <div class="kpi-grid">
        <div class="kpi" style="--c:#7C3AED"><div class="val">8,910</div><div class="lbl">Total Trainers</div></div>
        <div class="kpi" style="--c:#007B5E"><div class="val">6,240</div><div class="lbl">Certified</div></div>
        <div class="kpi" style="--c:#F4A900"><div class="val">480</div><div class="lbl">Renewal Due</div></div>
        <div class="kpi" style="--c:#DC2626"><div class="val">190</div><div class="lbl">Suspended</div></div>
      </div>
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <div class="card-title" style="margin:0">Trainer Registry</div>
          <div style="display:flex;gap:8px">
            <input type="text" placeholder="Search trainer...">
            <select><option>All Sectors</option><option>IT/ITeS</option><option>Healthcare</option><option>Construction</option><option>Retail</option></select>
            <button class="action-btn btn-teal">📤 Export</button>
          </div>
        </div>
        <table><thead><tr><th>Trainer ID</th><th>Name</th><th>Sector</th><th>Partner</th><th>State</th><th>Batches</th><th>Avg Rating</th><th>Status</th></tr></thead>
        <tbody>${[['TR-001','Ramesh Gupta','IT / ITeS','WiiFlex Pvt Ltd','Telangana',12,'4.8/5','Active'],['TR-002','Sunita Patel','Healthcare','SkillUp India','Maharashtra',9,'4.6/5','Active'],['TR-003','Arun Yadav','Construction','Rural Skill Dev','Rajasthan',14,'4.4/5','Active'],['TR-004','Meena Sharma','Retail','TechLearn Academy','Karnataka',0,'—','Pending'],['TR-005','Vijay Kumar','Logistics','FutureTech','Gujarat',7,'4.2/5','Active'],['TR-006','Divya Nair','Beauty & Wellness','SkillUp India','Kerala',11,'4.7/5','Active']].map(([id,n,sec,tp,st,b,rat,s])=>`
          <tr>
            <td style="font-size:10.5px;color:#6B7FA3">${id}</td>
            <td style="font-weight:600">${n}</td>
            <td>${sec}</td>
            <td style="font-size:11px">${tp}</td>
            <td>${st}</td>
            <td style="text-align:center;font-weight:700;color:#1A56C4">${b}</td>
            <td style="font-weight:700;color:#007B5E">${rat}</td>
            <td><span class="pill ${s==='Active'?'green':'amber'}">${s}</span></td>
          </tr>`).join('')}
        </tbody></table>
      </div>`,

    'tr-assess': `
      <div class="page-header"><h1>Assessor Registry</h1><p>All empanelled assessors and their sector assignments</p></div>
      <div class="kpi-grid">
        <div class="kpi" style="--c:#1A56C4"><div class="val">2,840</div><div class="lbl">Total Assessors</div></div>
        <div class="kpi" style="--c:#007B5E"><div class="val">2,420</div><div class="lbl">Active</div></div>
        <div class="kpi" style="--c:#F4A900"><div class="val">280</div><div class="lbl">Renewal Due</div></div>
        <div class="kpi" style="--c:#7C3AED"><div class="val">18</div><div class="lbl">Agencies Empanelled</div></div>
      </div>
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <div class="card-title" style="margin:0">Assessor Registry</div>
          <div style="display:flex;gap:8px">
            <input type="text" placeholder="Search assessor...">
            <select><option>All Agencies</option><option>Wheebox</option><option>KPMG</option><option>Merit Trac</option></select>
            <button class="action-btn btn-teal">📤 Export</button>
          </div>
        </div>
        <table><thead><tr><th>Assessor ID</th><th>Name</th><th>Agency</th><th>Sector</th><th>State</th><th>Assessments Done</th><th>Valid Until</th><th>Status</th></tr></thead>
        <tbody>${[['ASR-001','Dr. Pradeep Nair','Wheebox','IT / ITeS','Karnataka',840,'Mar 2026','Active'],['ASR-002','Ms. Kavitha Rao','KPMG','Healthcare','Tamil Nadu',620,'Jun 2025','Active'],['ASR-003','Shri Rakesh Joshi','Merit Trac','Construction','Rajasthan',480,'Dec 2025','Active'],['ASR-004','Ms. Sneha Gupta','Wheebox','Retail','UP',310,'Sep 2025','Active'],['ASR-005','Shri Anil Verma','NSDC Panel','Logistics','Maharashtra',290,'Jan 2025','Expiring']].map(([id,n,ag,sec,st,ad,vu,s])=>`
          <tr>
            <td style="font-size:10.5px;color:#6B7FA3">${id}</td>
            <td style="font-weight:600">${n}</td>
            <td style="font-size:11px">${ag}</td>
            <td>${sec}</td>
            <td>${st}</td>
            <td style="text-align:center;font-weight:700;color:#1A56C4">${ad}</td>
            <td style="font-size:11px">${vu}</td>
            <td><span class="pill ${s==='Active'?'green':'amber'}">${s}</span></td>
          </tr>`).join('')}
        </tbody></table>
      </div>`,

    'tr-certs': `
      <div class="page-header"><h1>Certifications & Badges</h1><p>Trainer qualification certificates and digital badge tracking</p></div>
      <div class="kpi-grid">
        <div class="kpi" style="--c:#007B5E"><div class="val">6,240</div><div class="lbl">Certified Trainers</div></div>
        <div class="kpi" style="--c:#1A56C4"><div class="val">4,820</div><div class="lbl">Badges Issued</div></div>
        <div class="kpi" style="--c:#F4A900"><div class="val">480</div><div class="lbl">Renewal Pending</div></div>
        <div class="kpi" style="--c:#DC2626"><div class="val">62</div><div class="lbl">Expired</div></div>
      </div>
      <div class="grid2">
        <div class="card">
          <div class="card-title">📜 Recent Certifications</div>
          <table><thead><tr><th>Trainer</th><th>Cert Type</th><th>Sector</th><th>Issued</th><th>Valid Until</th><th>Status</th></tr></thead>
          <tbody>${[['Ramesh Gupta','TOT - Level 4','IT / ITeS','Dec 2024','Dec 2027','Valid'],['Sunita Patel','TOT - Level 3','Healthcare','Nov 2024','Nov 2026','Valid'],['Arun Yadav','TOT - Level 3','Construction','Oct 2024','Oct 2026','Valid'],['Divya Nair','Master Trainer','Beauty','Sep 2024','Sep 2027','Valid'],['Vijay Kumar','TOT - Level 2','Logistics','Aug 2024','Aug 2025','Expiring']].map(([n,c,s,i,vu,st])=>`
            <tr>
              <td style="font-weight:600">${n}</td>
              <td style="font-size:11px">${c}</td>
              <td>${s}</td>
              <td style="font-size:11px">${i}</td>
              <td style="font-size:11px">${vu}</td>
              <td><span class="pill ${st==='Valid'?'green':'amber'}">${st}</span></td>
            </tr>`).join('')}
          </tbody></table>
        </div>
        <div class="card">
          <div class="card-title">🎖️ Badge Summary by Type</div>
          ${[['TOT Level 4 (Master)','820','#1A56C4',82],['TOT Level 3','1,840','#007B5E',100],['TOT Level 2','2,160','#7C3AED',100],['Assessor Certified','480','#F4A900',48],['Digital Competency','320','#DC2626',32],['Soft Skills Certified','1,200','#0891B2',100]].map(([l,v,c,p])=>`
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:9px">
              <div style="width:140px;font-size:11.5px;color:#3D5170;flex-shrink:0">${l}</div>
              <div style="flex:1"><div class="prog-bar"><div class="prog-fill" style="width:${Math.min(p,100)}%;background:${c}"></div></div></div>
              <div style="font-size:11px;font-weight:700;color:${c};width:44px;text-align:right">${v}</div>
            </div>`).join('')}
        </div>
      </div>`,

    'course-catalogue': `
      <div class="page-header"><h1>Course Catalogue</h1><p>All approved courses across sectors and NSQF levels</p></div>
      <div class="kpi-grid">
        <div class="kpi" style="--c:#1A56C4"><div class="val">2,840</div><div class="lbl">Total Courses</div></div>
        <div class="kpi" style="--c:#007B5E"><div class="val">2,320</div><div class="lbl">Approved</div></div>
        <div class="kpi" style="--c:#F4A900"><div class="val">380</div><div class="lbl">Pending Approval</div></div>
        <div class="kpi" style="--c:#7C3AED"><div class="val">24</div><div class="lbl">Sectors Covered</div></div>
      </div>
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <div class="card-title" style="margin:0">Course Catalogue</div>
          <div style="display:flex;gap:8px">
            <input type="text" placeholder="Search course...">
            <select><option>All Sectors</option><option>IT/ITeS</option><option>Healthcare</option><option>Construction</option></select>
            <select><option>All NSQF Levels</option><option>Level 1</option><option>Level 2</option><option>Level 3</option><option>Level 4</option></select>
            <button class="action-btn btn-primary">+ Add Course</button>
          </div>
        </div>
        <table><thead><tr><th>Course Name</th><th>Sector</th><th>NSQF Level</th><th>Duration</th><th>Partners</th><th>Enrolled</th><th>Status</th></tr></thead>
        <tbody>${[['Digital Marketing','IT / ITeS','L4','300 hrs',42,18240,'Approved'],['Healthcare Assistant','Healthcare','L3','200 hrs',28,12400,'Approved'],['Electrical Technician','Construction','L3','400 hrs',36,9800,'Approved'],['Data Entry Operator','IT / ITeS','L2','150 hrs',64,22400,'Approved'],['Beauty Therapist','Beauty & Wellness','L3','250 hrs',18,6200,'Approved'],['Logistics Executive','Logistics','L3','180 hrs',24,8400,'Approved'],['AI & ML Basics','IT / ITeS','L5','360 hrs',12,3200,'Pending']].map(([cn,sec,nsqf,dur,p,en,s])=>`
          <tr>
            <td style="font-weight:600;color:#003366">${cn}</td>
            <td>${sec}</td>
            <td><span class="pill blue">${nsqf}</span></td>
            <td style="font-size:11px">${dur}</td>
            <td style="text-align:center">${p}</td>
            <td style="text-align:center;font-weight:700">${Number(en).toLocaleString()}</td>
            <td><span class="pill ${s==='Approved'?'green':'amber'}">${s}</span></td>
          </tr>`).join('')}
        </tbody></table>
      </div>`,

    'course-nsqf': `
      <div class="page-header"><h1>NSQF Framework</h1><p>National Skills Qualifications Framework — level mapping and sector skills councils</p></div>
      <div class="kpi-grid">
        <div class="kpi" style="--c:#003366"><div class="val">10</div><div class="lbl">NSQF Levels</div></div>
        <div class="kpi" style="--c:#1A56C4"><div class="val">37</div><div class="lbl">Sector Skill Councils</div></div>
        <div class="kpi" style="--c:#007B5E"><div class="val">2,840</div><div class="lbl">Mapped Courses</div></div>
        <div class="kpi" style="--c:#7C3AED"><div class="val">14,200</div><div class="lbl">Job Roles Defined</div></div>
      </div>
      <div class="grid2">
        <div class="card">
          <div class="card-title">📊 Courses by NSQF Level</div>
          ${[['Level 1 — Foundation',180,'#6B7FA3',18],['Level 2 — Semi-skilled',420,'#0891B2',42],['Level 3 — Skilled',840,'#007B5E',84],['Level 4 — Supervisory',680,'#1A56C4',68],['Level 5 — Technical',380,'#7C3AED',38],['Level 6 — Analyst',240,'#F4A900',24],['Level 7+ — Expert',100,'#DC2626',10]].map(([l,v,c,p])=>`
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:9px">
              <div style="width:160px;font-size:11.5px;color:#3D5170;flex-shrink:0">${l}</div>
              <div style="flex:1"><div class="prog-bar"><div class="prog-fill" style="width:${p}%;background:${c}"></div></div></div>
              <div style="font-size:11px;font-weight:700;color:${c};width:36px;text-align:right">${v}</div>
            </div>`).join('')}
        </div>
        <div class="card">
          <div class="card-title">🏭 Top Sector Skill Councils</div>
          <table><thead><tr><th>SSC</th><th>Sector</th><th>Job Roles</th><th>Courses</th></tr></thead>
          <tbody>${[['IT-ITeS SSC','IT / ITeS',480,320],['HSSC','Healthcare',380,240],['CSSC','Construction',420,280],['LSC','Logistics',240,160],['RASCI','Retail',320,200],['B&WSSC','Beauty',180,120]].map(([ssc,sec,jr,c])=>`
            <tr>
              <td style="font-weight:600;color:#003366">${ssc}</td>
              <td>${sec}</td>
              <td style="text-align:center;font-weight:700">${jr}</td>
              <td style="text-align:center;color:#1A56C4;font-weight:700">${c}</td>
            </tr>`).join('')}
          </tbody></table>
        </div>
      </div>`,

    'course-approve': `
      <div class="page-header"><h1>Approval Queue</h1><p>Courses submitted by training partners awaiting admin review</p></div>
      <div class="kpi-grid">
        <div class="kpi" style="--c:#F4A900"><div class="val">380</div><div class="lbl">Pending Approval</div></div>
        <div class="kpi" style="--c:#1A56C4"><div class="val">64</div><div class="lbl">Under Review</div></div>
        <div class="kpi" style="--c:#007B5E"><div class="val">2,320</div><div class="lbl">Approved Total</div></div>
        <div class="kpi" style="--c:#DC2626"><div class="val">48</div><div class="lbl">Rejected This Month</div></div>
      </div>
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <div class="card-title" style="margin:0">Pending Course Approvals</div>
          <div style="display:flex;gap:8px">
            <select><option>All Sectors</option><option>IT/ITeS</option><option>Healthcare</option></select>
            <button class="action-btn btn-teal">📤 Export</button>
          </div>
        </div>
        <table><thead><tr><th>Course Name</th><th>Partner</th><th>Sector</th><th>NSQF</th><th>Duration</th><th>Submitted</th><th>Action</th></tr></thead>
        <tbody>${[['AI & ML Basics','WiiFlex Pvt Ltd','IT / ITeS','L5','360 hrs','28 Dec 2024'],['Phlebotomy Tech','SkillUp India','Healthcare','L3','180 hrs','27 Dec 2024'],['Green Construction','Rural Skill Dev','Construction','L4','400 hrs','26 Dec 2024'],['E-Commerce Ops','TechLearn Academy','Retail','L3','200 hrs','25 Dec 2024'],['Cold Chain Logistics','FutureTech','Logistics','L3','240 hrs','24 Dec 2024']].map(([cn,p,sec,nsqf,dur,sub])=>`
          <tr>
            <td style="font-weight:600;color:#003366">${cn}</td>
            <td style="font-size:11px">${p}</td>
            <td>${sec}</td>
            <td><span class="pill blue">${nsqf}</span></td>
            <td style="font-size:11px">${dur}</td>
            <td style="font-size:11px;color:#6B7FA3">${sub}</td>
            <td>
              <div style="display:flex;gap:4px">
                <button class="action-btn btn-teal" style="font-size:10px;padding:3px 8px">✓ Approve</button>
                <button class="action-btn btn-danger" style="font-size:10px;padding:3px 8px">✗ Reject</button>
              </div>
            </td>
          </tr>`).join('')}
        </tbody></table>
      </div>`,

    'course-upload': `
      <div class="page-header"><h1>Curriculum Upload</h1><p>Upload and manage course curriculum documents and materials</p></div>
      <div class="grid2">
        <div class="card">
          <div class="card-title">📁 Upload Curriculum</div>
          <div style="padding:8px 0">
            <label style="font-size:11px;font-weight:700;color:#3D5170;display:block;margin-bottom:5px">Select Course</label>
            <select style="width:100%;margin-bottom:10px"><option>Digital Marketing L4</option><option>Healthcare Assistant L3</option><option>Electrical Technician L3</option></select>
            <label style="font-size:11px;font-weight:700;color:#3D5170;display:block;margin-bottom:5px">Document Type</label>
            <select style="width:100%;margin-bottom:10px"><option>Course Curriculum</option><option>Study Material</option><option>Assessment Guide</option><option>Trainer Manual</option></select>
            <div style="border:2px dashed #BFDBFE;border-radius:8px;padding:24px;text-align:center;background:#EFF6FF;margin-bottom:10px">
              <div style="font-size:24px;margin-bottom:6px">📄</div>
              <div style="font-size:12px;font-weight:700;color:#1A56C4">Drop PDF / DOCX here</div>
              <div style="font-size:11px;color:#6B7FA3;margin-top:3px">or click to browse — Max 20 MB</div>
            </div>
            <button class="action-btn btn-primary" style="width:100%;justify-content:center">📤 Upload Document</button>
          </div>
        </div>
        <div class="card">
          <div class="card-title">📂 Recently Uploaded</div>
          ${[['Digital Marketing Curriculum v2.1','PDF','4.2 MB','Dec 2024','WiiFlex','Approved'],['Healthcare Trainer Manual','DOCX','2.8 MB','Dec 2024','SkillUp India','Approved'],['Electrical Assessment Guide','PDF','3.1 MB','Nov 2024','Rural Skill Dev','Under Review'],['Retail Course Material','PDF','5.4 MB','Nov 2024','TechLearn','Approved'],['Logistics Study Pack','DOCX','1.9 MB','Oct 2024','FutureTech','Approved']].map(([n,t,sz,d,p,s])=>`
            <div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid #F1F5F9">
              <div style="font-size:20px">${t==='PDF'?'📄':'📝'}</div>
              <div style="flex:1">
                <div style="font-size:12px;font-weight:600;color:#1A2B4A">${n}</div>
                <div style="font-size:10px;color:#6B7FA3">${t} · ${sz} · ${d} · ${p}</div>
              </div>
              <span class="pill ${s==='Approved'?'green':'amber'}" style="font-size:9px">${s}</span>
            </div>`).join('')}
        </div>
      </div>`,

    sectors: `
      <div class="page-header"><h1>Sectors & Job Roles</h1><p>All sectors, sub-sectors and NSQF-aligned job roles</p></div>
      <div class="kpi-grid">
        <div class="kpi" style="--c:#1A56C4"><div class="val">24</div><div class="lbl">Sectors</div></div>
        <div class="kpi" style="--c:#007B5E"><div class="val">37</div><div class="lbl">Sector Skill Councils</div></div>
        <div class="kpi" style="--c:#7C3AED"><div class="val">14,200</div><div class="lbl">Job Roles</div></div>
        <div class="kpi" style="--c:#F4A900"><div class="val">2,840</div><div class="lbl">Mapped Courses</div></div>
      </div>
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <div class="card-title" style="margin:0">Sector Directory</div>
          <div style="display:flex;gap:8px"><input type="text" placeholder="Search sector..."><button class="action-btn btn-primary">+ Add Sector</button></div>
        </div>
        <table><thead><tr><th>Sector</th><th>SSC</th><th>Job Roles</th><th>Courses</th><th>Trainees</th><th>Status</th></tr></thead>
        <tbody>${[['IT / ITeS','IT-ITeS SSC',480,320,28400,'Active'],['Healthcare','HSSC',380,240,18200,'Active'],['Construction','CSSC',420,280,12800,'Active'],['Logistics','LSC',240,160,9400,'Active'],['Retail','RASCI',320,200,8100,'Active'],['Beauty & Wellness','B&WSSC',180,120,4800,'Active'],['Agriculture','AgSSC',280,180,6200,'Active'],['Automotive','ASDC',160,100,3800,'Active']].map(([sec,ssc,jr,c,tr,s])=>`
          <tr>
            <td style="font-weight:600;color:#003366">${sec}</td>
            <td style="font-size:11px">${ssc}</td>
            <td style="text-align:center;font-weight:700">${jr}</td>
            <td style="text-align:center;color:#1A56C4;font-weight:700">${c}</td>
            <td style="text-align:center">${Number(tr).toLocaleString()}</td>
            <td><span class="pill green">${s}</span></td>
          </tr>`).join('')}
        </tbody></table>
      </div>`,

    ddugky: `
      <div class="page-header"><h1>DDU-GKY</h1><p>Deen Dayal Upadhyaya Grameen Kaushalya Yojana — rural youth skilling</p></div>
      <div class="kpi-grid">
        <div class="kpi" style="--c:#007B5E"><div class="val">22,180</div><div class="lbl">Total Enrolled</div></div>
        <div class="kpi" style="--c:#1A56C4"><div class="val">17,440</div><div class="lbl">Certified</div></div>
        <div class="kpi" style="--c:#7C3AED"><div class="val">14,200</div><div class="lbl">Placed</div></div>
        <div class="kpi" style="--c:#F4A900"><div class="val">₹42.8 Cr</div><div class="lbl">Funds Disbursed</div></div>
      </div>
      <div class="grid2">
        <div class="card">
          <div class="card-title">🌾 State-wise Progress</div>
          <table><thead><tr><th>State</th><th>Enrolled</th><th>Certified</th><th>Placed</th><th>Status</th></tr></thead>
          <tbody>${[['Uttar Pradesh',6240,4820,3980,'Active'],['Bihar',4180,3240,2640,'Active'],['Rajasthan',3200,2480,2020,'Active'],['Madhya Pradesh',2840,2180,1760,'Active'],['Jharkhand',2420,1880,1560,'Active'],['Odisha',3300,2840,2240,'Active']].map(([s,e,c,p,st])=>`
            <tr>
              <td style="font-weight:600">${s}</td>
              <td style="text-align:center">${Number(e).toLocaleString()}</td>
              <td style="text-align:center">${Number(c).toLocaleString()}</td>
              <td style="text-align:center;font-weight:700;color:#007B5E">${Number(p).toLocaleString()}</td>
              <td><span class="pill green">${st}</span></td>
            </tr>`).join('')}
          </tbody></table>
        </div>
        <div class="card">
          <div class="card-title">💵 Financial Summary</div>
          ${[['Total Budget Allocated','₹68.0 Cr'],['Disbursed to TPs','₹42.8 Cr'],['Pending Disbursement','₹14.4 Cr'],['Under Audit','₹10.8 Cr'],['Avg. Cost per Trainee','₹14,200'],['Utilisation Rate','63%']].map(([l,v])=>`
            <div class="stat-row"><span class="lbl">${l}</span><span class="val">${v}</span></div>`).join('')}
        </div>
      </div>`,

    naps: `
      <div class="page-header"><h1>NAPS — Apprenticeship</h1><p>National Apprenticeship Promotion Scheme — employer-led on-the-job training</p></div>
      <div class="kpi-grid">
        <div class="kpi" style="--c:#1A56C4"><div class="val">18,900</div><div class="lbl">Apprentices Enrolled</div></div>
        <div class="kpi" style="--c:#007B5E"><div class="val">14,200</div><div class="lbl">Completed</div></div>
        <div class="kpi" style="--c:#7C3AED"><div class="val">2,840</div><div class="lbl">Employer Partners</div></div>
        <div class="kpi" style="--c:#F4A900"><div class="val">₹28.4 Cr</div><div class="lbl">Stipend Disbursed</div></div>
      </div>
      <div class="grid2">
        <div class="card">
          <div class="card-title">🔧 Sector-wise Apprentices</div>
          ${[['Manufacturing',5200,'#1A56C4',52],['IT / ITeS',4100,'#007B5E',41],['Automotive',2800,'#7C3AED',28],['Construction',2400,'#F4A900',24],['Retail',1900,'#DC2626',19],['Logistics',2500,'#0891B2',25]].map(([s,v,c,p])=>`
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:9px">
              <div style="width:120px;font-size:11.5px;color:#3D5170;flex-shrink:0">${s}</div>
              <div style="flex:1"><div class="prog-bar"><div class="prog-fill" style="width:${p}%;background:${c}"></div></div></div>
              <div style="font-size:11px;font-weight:700;color:${c};width:44px;text-align:right">${Number(v).toLocaleString()}</div>
            </div>`).join('')}
        </div>
        <div class="card">
          <div class="card-title">🏢 Top Employer Partners</div>
          <table><thead><tr><th>Employer</th><th>Sector</th><th>Apprentices</th><th>Completed</th></tr></thead>
          <tbody>${[['Maruti Suzuki','Automotive',820,640],['TCS','IT / ITeS',680,520],['L&T','Construction',560,420],['Bosch India','Manufacturing',480,380],['Amazon','Logistics',420,320],['Reliance Retail','Retail',360,280]].map(([e,s,a,c])=>`
            <tr>
              <td style="font-weight:600">${e}</td>
              <td style="font-size:11px">${s}</td>
              <td style="text-align:center;font-weight:700;color:#1A56C4">${a}</td>
              <td style="text-align:center;font-weight:700;color:#007B5E">${c}</td>
            </tr>`).join('')}
          </tbody></table>
        </div>
      </div>`,

    'state-skill': `
      <div class="page-header"><h1>State Skill Missions</h1><p>State government skill development programs and missions</p></div>
      <div class="kpi-grid">
        <div class="kpi" style="--c:#003366"><div class="val">24</div><div class="lbl">Active States</div></div>
        <div class="kpi" style="--c:#1A56C4"><div class="val">21,300</div><div class="lbl">Enrolled</div></div>
        <div class="kpi" style="--c:#007B5E"><div class="val">16,800</div><div class="lbl">Certified</div></div>
        <div class="kpi" style="--c:#F4A900"><div class="val">₹36.4 Cr</div><div class="lbl">State Funds</div></div>
      </div>
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <div class="card-title" style="margin:0">State Missions</div>
          <div style="display:flex;gap:8px"><input type="text" placeholder="Search state..."><button class="action-btn btn-teal">📤 Export</button></div>
        </div>
        <table><thead><tr><th>State</th><th>Mission Name</th><th>Enrolled</th><th>Certified</th><th>Placed</th><th>Budget</th><th>Status</th></tr></thead>
        <tbody>${[['Telangana','TASK — Telangana Academy',3200,2640,2100,'₹6.2 Cr','Active'],['Maharashtra','MSSDS',2840,2200,1760,'₹5.4 Cr','Active'],['Karnataka','KSDP',2400,1880,1480,'₹4.8 Cr','Active'],['Gujarat','GSDM',2100,1640,1320,'₹4.2 Cr','Active'],['Rajasthan','RSLDC',1980,1520,1200,'₹3.8 Cr','Active'],['UP','UPSDM',3800,2920,2240,'₹7.4 Cr','Active'],['Tamil Nadu','TNSDC',2480,1960,1560,'₹4.6 Cr','Active'],['Odisha','OSDA',2500,1960,1500,'₹5.0 Cr','Active']].map(([s,m,e,c,p,b,st])=>`
          <tr>
            <td style="font-weight:600;color:#003366">${s}</td>
            <td style="font-size:11px">${m}</td>
            <td style="text-align:center">${Number(e).toLocaleString()}</td>
            <td style="text-align:center">${Number(c).toLocaleString()}</td>
            <td style="text-align:center;font-weight:700;color:#007B5E">${Number(p).toLocaleString()}</td>
            <td style="font-weight:700;color:#1A56C4">${b}</td>
            <td><span class="pill green">${st}</span></td>
          </tr>`).join('')}
        </tbody></table>
      </div>`,

    'csr-prog': `
      <div class="page-header"><h1>CSR-Funded Programs</h1><p>Corporate Social Responsibility skilling programs and fund utilisation</p></div>
      <div class="kpi-grid">
        <div class="kpi" style="--c:#007B5E"><div class="val">42</div><div class="lbl">Active Programs</div></div>
        <div class="kpi" style="--c:#1A56C4"><div class="val">8,200</div><div class="lbl">Beneficiaries</div></div>
        <div class="kpi" style="--c:#7C3AED"><div class="val">₹48.2 Cr</div><div class="lbl">Total CSR Funds</div></div>
        <div class="kpi" style="--c:#F4A900"><div class="val">₹32.6 Cr</div><div class="lbl">Utilised</div></div>
      </div>
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <div class="card-title" style="margin:0">CSR Programs</div>
          <div style="display:flex;gap:8px"><input type="text" placeholder="Search program..."><button class="action-btn btn-primary">+ Add Program</button></div>
        </div>
        <table><thead><tr><th>Program</th><th>CSR Partner</th><th>Sector</th><th>Beneficiaries</th><th>Fund</th><th>Utilised</th><th>Status</th></tr></thead>
        <tbody>${[['Women in Tech','Tata CSR Foundation','IT / ITeS',1200,'₹8.4 Cr','₹6.2 Cr','Active'],['Rural Health Workers','Wipro Cares','Healthcare',840,'₹5.8 Cr','₹4.1 Cr','Active'],['Smart Agriculture','HCL Foundation','Agriculture',620,'₹4.2 Cr','₹2.8 Cr','Active'],['Youth Entrepreneur','Infosys Foundation','Multi-sector',480,'₹3.6 Cr','₹2.4 Cr','Active'],['Green Skills Initiative','Mahindra Rise','Construction',560,'₹4.8 Cr','₹3.2 Cr','Active'],['Digital Finance Literacy','HDFC Bank CSR','BFSI',320,'₹2.4 Cr','₹1.8 Cr','Active']].map(([pr,cp,sec,b,f,u,s])=>`
          <tr>
            <td style="font-weight:600;color:#003366">${pr}</td>
            <td style="font-size:11px">${cp}</td>
            <td>${sec}</td>
            <td style="text-align:center">${Number(b).toLocaleString()}</td>
            <td style="font-weight:700;color:#1A56C4">${f}</td>
            <td style="font-weight:700;color:#007B5E">${u}</td>
            <td><span class="pill green">${s}</span></td>
          </tr>`).join('')}
        </tbody></table>
      </div>`,

    'fee-prog': `
      <div class="page-header"><h1>Fee-Based Programs</h1><p>Self-funded and fee-paying skill development programs</p></div>
      <div class="kpi-grid">
        <div class="kpi" style="--c:#1A56C4"><div class="val">6,000</div><div class="lbl">Enrolled</div></div>
        <div class="kpi" style="--c:#007B5E"><div class="val">5,200</div><div class="lbl">Completed</div></div>
        <div class="kpi" style="--c:#7C3AED"><div class="val">₹18.4 Cr</div><div class="lbl">Revenue Generated</div></div>
        <div class="kpi" style="--c:#F4A900"><div class="val">2,980</div><div class="lbl">Placed</div></div>
      </div>
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <div class="card-title" style="margin:0">Fee-Based Programs</div>
          <div style="display:flex;gap:8px">
            <input type="text" placeholder="Search program...">
            <button class="action-btn btn-primary">+ Add Program</button>
            <button class="action-btn btn-teal">📤 Export</button>
          </div>
        </div>
        <table><thead><tr><th>Program</th><th>Partner</th><th>Sector</th><th>Fee</th><th>Enrolled</th><th>Revenue</th><th>Status</th></tr></thead>
        <tbody>${[['Advanced Digital Marketing','WiiFlex Pvt Ltd','IT / ITeS','₹12,000',480,'₹57.6 L','Active'],['Full Stack Development','TechLearn Academy','IT / ITeS','₹18,000',320,'₹57.6 L','Active'],['Clinical Nutrition','SkillUp India','Healthcare','₹8,000',240,'₹19.2 L','Active'],['Interior Design','FutureTech','Design','₹15,000',180,'₹27.0 L','Active'],['Digital Accounting','WiiFlex Pvt Ltd','BFSI','₹6,000',420,'₹25.2 L','Active'],['Spoken English Pro','TechLearn Academy','Soft Skills','₹3,500',680,'₹23.8 L','Active']].map(([pr,p,sec,fee,en,rev,s])=>`
          <tr>
            <td style="font-weight:600;color:#003366">${pr}</td>
            <td style="font-size:11px">${p}</td>
            <td>${sec}</td>
            <td style="font-weight:700;color:#1A56C4">${fee}</td>
            <td style="text-align:center">${en}</td>
            <td style="font-weight:700;color:#007B5E">${rev}</td>
            <td><span class="pill green">${s}</span></td>
          </tr>`).join('')}
        </tbody></table>
      </div>`,

    'scheme-config': `
      <div class="page-header"><h1>Scheme Configuration</h1><p>Configure eligibility, targets and parameters for all schemes</p></div>
      <div class="grid2">
        <div class="card">
          <div class="card-title">⚙️ Active Schemes</div>
          ${[['PMKVY 4.0','48,240 target','#003366','Active'],['DDU-GKY','22,180 target','#007B5E','Active'],['NAPS','18,900 target','#1A56C4','Active'],['State Skill Mission','21,300 target','#7C3AED','Active'],['CSR Programs','8,200 target','#F4A900','Active'],['Fee-Based','6,000 target','#DC2626','Active']].map(([s,t,c,st])=>`
            <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid #F1F5F9">
              <div style="width:10px;height:10px;border-radius:50%;background:${c};flex-shrink:0"></div>
              <div style="flex:1">
                <div style="font-size:12px;font-weight:700;color:#1A2B4A">${s}</div>
                <div style="font-size:11px;color:#6B7FA3">${t}</div>
              </div>
              <span class="pill green">${st}</span>
              <button class="action-btn btn-outline" style="font-size:10px;padding:4px 9px">Edit</button>
            </div>`).join('')}
        </div>
        <div class="card">
          <div class="card-title">🔧 PMKVY 4.0 — Config</div>
          <div style="padding:4px 0">
            ${[['Annual Target','48,240'],['Current FY Target','12,000'],['Min Age Eligibility','15 years'],['Max Age Eligibility','45 years'],['Min Education','Class 8 Pass'],['Stipend per Trainee','₹12,400'],['Assessment Agency','NSDC / Wheebox'],['Certificate Authority','NSDC']].map(([l,v])=>`
              <div class="stat-row"><span class="lbl">${l}</span><span class="val">${v}</span></div>`).join('')}
            <button class="action-btn btn-primary" style="margin-top:12px;width:100%;justify-content:center">💾 Save Changes</button>
          </div>
        </div>
      </div>`,

    'candidate-reg': `
      <div class="page-header"><h1>Candidate Registry</h1><p>All registered learners — demographics, scheme and status</p></div>
      <div class="kpi-grid">
        <div class="kpi" style="--c:#1A56C4"><div class="val">1,24,820</div><div class="lbl">Total Candidates</div></div>
        <div class="kpi" style="--c:#007B5E"><div class="val">61,204</div><div class="lbl">Certified</div></div>
        <div class="kpi" style="--c:#7C3AED"><div class="val">43,180</div><div class="lbl">Placed</div></div>
        <div class="kpi" style="--c:#DC2626"><div class="val">9,840</div><div class="lbl">Dropouts</div></div>
      </div>
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <div class="card-title" style="margin:0">Candidate Registry</div>
          <div style="display:flex;gap:8px">
            <input type="text" placeholder="Search by name / ID...">
            <select><option>All Schemes</option><option>PMKVY 4.0</option><option>DDU-GKY</option><option>NAPS</option></select>
            <select><option>All States</option><option>Telangana</option><option>Maharashtra</option><option>UP</option></select>
            <button class="action-btn btn-teal">📤 Export</button>
          </div>
        </div>
        <table><thead><tr><th>Candidate ID</th><th>Name</th><th>Gender</th><th>State</th><th>Scheme</th><th>Course</th><th>Status</th><th>Placement</th></tr></thead>
        <tbody>${[['SKL-24-001821','Priya Sharma','Female','Telangana','PMKVY 4.0','Digital Marketing','Certified','Placed'],['SKL-24-001822','Ravi Kumar','Male','Maharashtra','DDU-GKY','Construction Tech','In Training','—'],['SKL-24-001823','Sunita Devi','Female','UP','PMKVY 4.0','Healthcare Asst.','Assessed','Pending'],['SKL-24-001824','Mohammed Ali','Male','Gujarat','NAPS','Electrical Tech','Certified','Placed'],['SKL-24-001825','Kavya Reddy','Female','Telangana','Fee-Based','IT Support','In Training','—'],['SKL-24-001826','Amit Singh','Male','Bihar','DDU-GKY','Agri Tech','Certified','Placed']].map(([id,n,g,st,sc,co,s,pl])=>`
          <tr>
            <td style="font-size:10.5px;color:#6B7FA3">${id}</td>
            <td style="font-weight:600">${n}</td>
            <td><span class="pill ${g==='Female'?'purple':'blue'}" style="font-size:9px">${g}</span></td>
            <td>${st}</td>
            <td><span class="pill blue" style="font-size:9px">${sc}</span></td>
            <td style="font-size:11px">${co}</td>
            <td><span class="pill ${s==='Certified'?'green':s==='In Training'?'blue':'amber'}">${s}</span></td>
            <td><span class="pill ${pl==='Placed'?'green':pl==='Pending'?'amber':'gray'}">${pl}</span></td>
          </tr>`).join('')}
        </tbody></table>
      </div>`,

    enrolments: `
      <div class="page-header"><h1>Enrolments</h1><p>All course enrolments across schemes, states and batches</p></div>
      <div class="kpi-grid">
        <div class="kpi" style="--c:#1A56C4"><div class="val">1,24,820</div><div class="lbl">Total Enrolments</div></div>
        <div class="kpi" style="--c:#007B5E"><div class="val">3,240</div><div class="lbl">This Month</div></div>
        <div class="kpi" style="--c:#F4A900"><div class="val">8,420</div><div class="lbl">Active Batches</div></div>
        <div class="kpi" style="--c:#DC2626"><div class="val">9,840</div><div class="lbl">Dropouts</div></div>
      </div>
      <div class="grid2">
        <div class="card">
          <div class="card-title">📊 Enrolments by Scheme</div>
          ${[['PMKVY 4.0',48240,'#003366',72],['DDU-GKY',22180,'#007B5E',42],['NAPS',18900,'#1A56C4',36],['State Skill Mission',21300,'#7C3AED',40],['CSR Programs',8200,'#F4A900',16],['Fee-Based',6000,'#DC2626',11]].map(([s,v,c,p])=>`
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:9px">
              <div style="width:130px;font-size:11.5px;color:#3D5170;flex-shrink:0">${s}</div>
              <div style="flex:1"><div class="prog-bar"><div class="prog-fill" style="width:${p}%;background:${c}"></div></div></div>
              <div style="font-size:11px;font-weight:700;color:${c};width:50px;text-align:right">${Number(v).toLocaleString()}</div>
            </div>`).join('')}
        </div>
        <div class="card">
          <div class="card-title">📋 Recent Enrolments</div>
          <table><thead><tr><th>Candidate</th><th>Course</th><th>Scheme</th><th>Date</th></tr></thead>
          <tbody>${[['Priya Sharma','Digital Marketing','PMKVY 4.0','04 Jan 2025'],['Ravi Kumar','Construction Tech','DDU-GKY','04 Jan 2025'],['Kavya Reddy','IT Support','Fee-Based','03 Jan 2025'],['Amit Singh','Agri Tech','DDU-GKY','03 Jan 2025'],['Sunita Devi','Healthcare Asst.','PMKVY 4.0','02 Jan 2025'],['Mohammed Ali','Electrical Tech','NAPS','02 Jan 2025']].map(([n,c,sc,d])=>`
            <tr>
              <td style="font-weight:600;font-size:11.5px">${n}</td>
              <td style="font-size:11px">${c}</td>
              <td><span class="pill blue" style="font-size:9px">${sc}</span></td>
              <td style="font-size:11px;color:#6B7FA3">${d}</td>
            </tr>`).join('')}
          </tbody></table>
        </div>
      </div>`,

    batches: `
      <div class="page-header"><h1>Batch Management</h1><p>All training batches — active, completed and upcoming</p></div>
      <div class="kpi-grid">
        <div class="kpi" style="--c:#1A56C4"><div class="val">8,420</div><div class="lbl">Total Batches</div></div>
        <div class="kpi" style="--c:#007B5E"><div class="val">3,240</div><div class="lbl">Active</div></div>
        <div class="kpi" style="--c:#7C3AED"><div class="val">4,820</div><div class="lbl">Completed</div></div>
        <div class="kpi" style="--c:#F4A900"><div class="val">360</div><div class="lbl">Upcoming</div></div>
      </div>
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <div class="card-title" style="margin:0">Batch Registry</div>
          <div style="display:flex;gap:8px">
            <input type="text" placeholder="Search batch...">
            <select><option>All Status</option><option>Active</option><option>Completed</option><option>Upcoming</option></select>
            <select><option>All States</option><option>Telangana</option><option>Maharashtra</option><option>UP</option></select>
            <button class="action-btn btn-primary">+ New Batch</button>
          </div>
        </div>
        <table><thead><tr><th>Batch ID</th><th>Course</th><th>Partner</th><th>Center</th><th>Start Date</th><th>End Date</th><th>Trainees</th><th>Status</th></tr></thead>
        <tbody>${[['B-2024-Q4-001','Digital Marketing','WiiFlex Pvt Ltd','Hyderabad Centre','01 Oct 2024','31 Dec 2024',42,'Completed'],['B-2024-Q4-002','Healthcare Asst.','SkillUp India','Pune Centre','15 Oct 2024','15 Jan 2025',38,'Active'],['B-2025-Q1-001','Construction Tech','Rural Skill Dev','Jaipur Centre','01 Jan 2025','31 Mar 2025',45,'Active'],['B-2025-Q1-002','IT Support','TechLearn Academy','Bangalore Centre','05 Jan 2025','05 Apr 2025',36,'Active'],['B-2025-Q1-003','Electrical Tech','Udyam Skill','Lucknow Centre','10 Jan 2025','10 Apr 2025',30,'Upcoming']].map(([id,c,p,cen,sd,ed,tr,s])=>`
          <tr>
            <td style="font-size:10.5px;color:#6B7FA3">${id}</td>
            <td style="font-weight:600">${c}</td>
            <td style="font-size:11px">${p}</td>
            <td style="font-size:11px">${cen}</td>
            <td style="font-size:11px">${sd}</td>
            <td style="font-size:11px">${ed}</td>
            <td style="text-align:center;font-weight:700">${tr}</td>
            <td><span class="pill ${s==='Active'?'green':s==='Completed'?'blue':'amber'}">${s}</span></td>
          </tr>`).join('')}
        </tbody></table>
      </div>`,

    attendance: `
      <div class="page-header"><h1>Attendance</h1><p>Trainee attendance tracking across all active batches</p></div>
      <div class="kpi-grid">
        <div class="kpi" style="--c:#007B5E"><div class="val">84%</div><div class="lbl">Avg Attendance Rate</div></div>
        <div class="kpi" style="--c:#1A56C4"><div class="val">3,240</div><div class="lbl">Active Batches</div></div>
        <div class="kpi" style="--c:#F4A900"><div class="val">420</div><div class="lbl">Below 75% Threshold</div></div>
        <div class="kpi" style="--c:#DC2626"><div class="val">84</div><div class="lbl">At Risk of Dropout</div></div>
      </div>
      <div class="grid2">
        <div class="card">
          <div class="card-title">📅 Batch-wise Attendance</div>
          <table><thead><tr><th>Batch ID</th><th>Course</th><th>Trainees</th><th>Avg %</th><th>Below 75%</th><th>Status</th></tr></thead>
          <tbody>${[['B-2025-Q1-001','Construction Tech',45,'91%',2,'Good'],['B-2024-Q4-002','Healthcare Asst.',38,'88%',3,'Good'],['B-2025-Q1-002','IT Support',36,'76%',8,'Alert'],['B-2025-Q1-003','Electrical Tech',30,'82%',4,'Good'],['B-2024-Q4-005','Retail Skills',42,'68%',14,'Critical']].map(([id,c,tr,avg,bl,s])=>`
            <tr>
              <td style="font-size:10.5px;color:#6B7FA3">${id}</td>
              <td style="font-weight:600;font-size:11.5px">${c}</td>
              <td style="text-align:center">${tr}</td>
              <td style="font-weight:700;color:${avg>='85%'?'#007B5E':avg>='75%'?'#F4A900':'#DC2626'}">${avg}</td>
              <td style="text-align:center;font-weight:700;color:#DC2626">${bl}</td>
              <td><span class="pill ${s==='Good'?'green':s==='Alert'?'amber':'red'}">${s}</span></td>
            </tr>`).join('')}
          </tbody></table>
        </div>
        <div class="card">
          <div class="card-title">⚠️ Low Attendance Candidates</div>
          <table><thead><tr><th>Candidate</th><th>Batch</th><th>Attendance</th><th>Action</th></tr></thead>
          <tbody>${[['Rohit Sharma','B-2024-Q4-005','58%'],['Pooja Gupta','B-2025-Q1-002','62%'],['Aakash Yadav','B-2024-Q4-005','64%'],['Suman Lata','B-2025-Q1-002','68%'],['Deepak Raj','B-2024-Q4-005','71%']].map(([n,b,a])=>`
            <tr>
              <td style="font-weight:600;font-size:11.5px">${n}</td>
              <td style="font-size:10.5px;color:#6B7FA3">${b}</td>
              <td style="font-weight:700;color:#DC2626">${a}</td>
              <td><button class="action-btn btn-outline" style="font-size:10px;padding:3px 8px">📩 Alert</button></td>
            </tr>`).join('')}
          </tbody></table>
        </div>
      </div>`,

    dropout: `
      <div class="page-header"><h1>Dropout Management</h1><p>Track, analyse and intervene on candidate dropouts</p></div>
      <div class="kpi-grid">
        <div class="kpi" style="--c:#DC2626"><div class="val">9,840</div><div class="lbl">Total Dropouts</div></div>
        <div class="kpi" style="--c:#F4A900"><div class="val">8%</div><div class="lbl">Dropout Rate</div></div>
        <div class="kpi" style="--c:#007B5E"><div class="val">2,420</div><div class="lbl">Re-enrolled</div></div>
        <div class="kpi" style="--c:#1A56C4"><div class="val">84</div><div class="lbl">At Risk (This Month)</div></div>
      </div>
      <div class="grid2">
        <div class="card">
          <div class="card-title">📊 Dropout Reasons</div>
          ${[['Financial Constraints',3840,'#DC2626',39],['Employment Found',2160,'#007B5E',22],['Family Reasons',1480,'#7C3AED',15],['Relocation',980,'#F4A900',10],['Course Mismatch',820,'#0891B2',8],['Health Issues',560,'#6B7FA3',6]].map(([r,v,c,p])=>`
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:9px">
              <div style="width:150px;font-size:11.5px;color:#3D5170;flex-shrink:0">${r}</div>
              <div style="flex:1"><div class="prog-bar"><div class="prog-fill" style="width:${p*2}%;background:${c}"></div></div></div>
              <div style="font-size:11px;font-weight:700;color:${c};width:44px;text-align:right">${Number(v).toLocaleString()}</div>
            </div>`).join('')}
        </div>
        <div class="card">
          <div class="card-title">⚠️ Recent Dropouts</div>
          <table><thead><tr><th>Candidate</th><th>Scheme</th><th>Reason</th><th>Action</th></tr></thead>
          <tbody>${[['Rohit Sharma','PMKVY 4.0','Financial'],['Pooja Gupta','DDU-GKY','Family'],['Aakash Yadav','Fee-Based','Employment'],['Suman Lata','NAPS','Relocation'],['Deepak Raj','PMKVY 4.0','Financial']].map(([n,sc,r])=>`
            <tr>
              <td style="font-weight:600;font-size:11.5px">${n}</td>
              <td><span class="pill blue" style="font-size:9px">${sc}</span></td>
              <td><span class="pill ${r==='Financial'?'red':r==='Employment'?'green':'amber'}">${r}</span></td>
              <td><button class="action-btn btn-outline" style="font-size:10px;padding:3px 8px">Re-enrol</button></td>
            </tr>`).join('')}
          </tbody></table>
        </div>
      </div>`,

    'target-ben': `
      <div class="page-header"><h1>Target Beneficiaries</h1><p>Scheme-wise beneficiary targets vs actual achievement</p></div>
      <div class="kpi-grid">
        <div class="kpi" style="--c:#003366"><div class="val">1,24,820</div><div class="lbl">Total Beneficiaries</div></div>
        <div class="kpi" style="--c:#007B5E"><div class="val">1,80,000</div><div class="lbl">Annual Target</div></div>
        <div class="kpi" style="--c:#1A56C4"><div class="val">69%</div><div class="lbl">Target Achievement</div></div>
        <div class="kpi" style="--c:#F4A900"><div class="val">55,180</div><div class="lbl">Gap to Target</div></div>
      </div>
      <div class="card">
        <div class="card-title">🎯 Scheme-wise Target vs Achievement</div>
        ${[['PMKVY 4.0',60000,48240,'#003366'],['DDU-GKY',30000,22180,'#007B5E'],['NAPS',25000,18900,'#1A56C4'],['State Skill Mission',35000,21300,'#7C3AED'],['CSR Programs',15000,8200,'#F4A900'],['Fee-Based',15000,6000,'#DC2626']].map(([s,t,a,c])=>`
          <div style="margin-bottom:14px">
            <div style="display:flex;justify-content:space-between;margin-bottom:4px">
              <span style="font-size:12px;font-weight:600;color:#1A2B4A">${s}</span>
              <span style="font-size:11px;color:#6B7FA3">${Number(a).toLocaleString()} / ${Number(t).toLocaleString()} &nbsp;<span style="font-weight:700;color:${c}">${Math.round(a/t*100)}%</span></span>
            </div>
            <div class="prog-bar" style="height:10px">
              <div class="prog-fill" style="width:${Math.round(a/t*100)}%;background:${c}"></div>
            </div>
          </div>`).join('')}
      </div>
      <div class="card" style="margin-top:14px">
        <div class="card-title">👥 Priority Beneficiary Groups</div>
        <table><thead><tr><th>Group</th><th>Target</th><th>Achieved</th><th>%</th><th>Gap</th></tr></thead>
        <tbody>${[['SC / ST Candidates',42000,28400,'67%',13600],['Women / Girls',54000,38200,'71%',15800],['Minority Communities',18000,11400,'63%',6600],['Differently Abled',6000,3200,'53%',2800],['Ex-Servicemen',3000,1820,'61%',1180]].map(([g,t,a,p,gap])=>`
          <tr>
            <td style="font-weight:600">${g}</td>
            <td style="text-align:center">${Number(t).toLocaleString()}</td>
            <td style="text-align:center;font-weight:700;color:#007B5E">${Number(a).toLocaleString()}</td>
            <td style="font-weight:700;color:#1A56C4">${p}</td>
            <td style="text-align:center;color:#DC2626;font-weight:700">${Number(gap).toLocaleString()}</td>
          </tr>`).join('')}
        </tbody></table>
      </div>`,

    'assess-agencies': `
      <div class="page-header"><h1>Assessment Agencies</h1><p>Empanelled agencies conducting skill assessments across sectors</p></div>
      <div class="kpi-grid">
        <div class="kpi" style="--c:#1A56C4"><div class="val">18</div><div class="lbl">Empanelled Agencies</div></div>
        <div class="kpi" style="--c:#007B5E"><div class="val">61,204</div><div class="lbl">Assessments Done</div></div>
        <div class="kpi" style="--c:#7C3AED"><div class="val">2,840</div><div class="lbl">Assessors</div></div>
        <div class="kpi" style="--c:#F4A900"><div class="val">4</div><div class="lbl">Pending Empanelment</div></div>
      </div>
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <div class="card-title" style="margin:0">Assessment Agency Registry</div>
          <div style="display:flex;gap:8px">
            <input type="text" placeholder="Search agency...">
            <button class="action-btn btn-primary">+ Empanel Agency</button>
            <button class="action-btn btn-teal">📤 Export</button>
          </div>
        </div>
        <table><thead><tr><th>Agency</th><th>Sectors Covered</th><th>Assessors</th><th>Assessments</th><th>Pass Rate</th><th>Valid Until</th><th>Status</th></tr></thead>
        <tbody>${[['Wheebox','IT/ITeS, BFSI, Retail',480,18400,'78%','Dec 2026','Active'],['KPMG Assessment','Healthcare, Pharma',280,12200,'82%','Mar 2026','Active'],['Merit Trac','Multi-sector',360,14800,'76%','Jun 2026','Active'],['Edumilestones','Construction, Logistics',180,7400,'74%','Sep 2025','Active'],['iXambee','IT/ITeS',120,4200,'80%','Dec 2025','Active'],['CoCubes','Soft Skills, Retail',240,4200,'77%','Mar 2026','Active']].map(([a,sec,asr,done,pr,vu,s])=>`
          <tr>
            <td style="font-weight:600;color:#003366">${a}</td>
            <td style="font-size:11px">${sec}</td>
            <td style="text-align:center">${asr}</td>
            <td style="text-align:center;font-weight:700">${Number(done).toLocaleString()}</td>
            <td style="font-weight:700;color:#007B5E">${pr}</td>
            <td style="font-size:11px">${vu}</td>
            <td><span class="pill ${s==='Active'?'green':'amber'}">${s}</span></td>
          </tr>`).join('')}
        </tbody></table>
      </div>`,

    'assess-sched': `
      <div class="page-header"><h1>Scheduled Assessments</h1><p>Upcoming and ongoing assessments across batches</p></div>
      <div class="kpi-grid">
        <div class="kpi" style="--c:#1A56C4"><div class="val">284</div><div class="lbl">Upcoming This Month</div></div>
        <div class="kpi" style="--c:#007B5E"><div class="val">48</div><div class="lbl">Ongoing Today</div></div>
        <div class="kpi" style="--c:#F4A900"><div class="val">12</div><div class="lbl">Rescheduled</div></div>
        <div class="kpi" style="--c:#DC2626"><div class="val">3</div><div class="lbl">Cancelled</div></div>
      </div>
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <div class="card-title" style="margin:0">Assessment Schedule</div>
          <div style="display:flex;gap:8px">
            <input type="date">
            <select><option>All Agencies</option><option>Wheebox</option><option>KPMG</option><option>Merit Trac</option></select>
            <button class="action-btn btn-primary">+ Schedule</button>
          </div>
        </div>
        <table><thead><tr><th>Assessment ID</th><th>Batch</th><th>Course</th><th>Agency</th><th>Date</th><th>Center</th><th>Candidates</th><th>Status</th></tr></thead>
        <tbody>${[['ASS-2025-0041','B-2024-Q4-002','Healthcare Asst.','KPMG','10 Jan 2025','Pune Centre',38,'Scheduled'],['ASS-2025-0042','B-2025-Q1-001','Construction Tech','Merit Trac','15 Jan 2025','Jaipur Centre',45,'Scheduled'],['ASS-2025-0040','B-2024-Q4-001','Digital Marketing','Wheebox','05 Jan 2025','Hyderabad','42','Ongoing'],['ASS-2025-0039','B-2024-Q3-018','IT Support','Wheebox','03 Jan 2025','Bangalore','36','Completed'],['ASS-2025-0038','B-2024-Q3-017','Retail Skills','CoCubes','02 Jan 2025','Mumbai','40','Completed']].map(([id,b,c,ag,d,cen,tr,s])=>`
          <tr>
            <td style="font-size:10.5px;color:#6B7FA3">${id}</td>
            <td style="font-size:10.5px">${b}</td>
            <td style="font-weight:600">${c}</td>
            <td style="font-size:11px">${ag}</td>
            <td style="font-size:11px">${d}</td>
            <td style="font-size:11px">${cen}</td>
            <td style="text-align:center;font-weight:700">${tr}</td>
            <td><span class="pill ${s==='Ongoing'?'blue':s==='Scheduled'?'amber':s==='Completed'?'green':'red'}">${s}</span></td>
          </tr>`).join('')}
        </tbody></table>
      </div>`,

    results: `
      <div class="page-header"><h1>Results & Marks</h1><p>Assessment results, pass/fail statistics and score distributions</p></div>
      <div class="kpi-grid">
        <div class="kpi" style="--c:#007B5E"><div class="val">61,204</div><div class="lbl">Total Passed</div></div>
        <div class="kpi" style="--c:#DC2626"><div class="val">12,480</div><div class="lbl">Failed</div></div>
        <div class="kpi" style="--c:#1A56C4"><div class="val">83%</div><div class="lbl">Pass Rate</div></div>
        <div class="kpi" style="--c:#7C3AED"><div class="val">74.2</div><div class="lbl">Avg Score</div></div>
      </div>
      <div class="grid2">
        <div class="card">
          <div class="card-title">📊 Score Distribution</div>
          ${[['90–100 (Distinction)',8420,'#007B5E',14],['75–89 (Merit)',22180,'#1A56C4',36],['60–74 (Pass)',30604,'#7C3AED',50],['40–59 (Marginal)',9840,'#F4A900',16],['Below 40 (Fail)',12480,'#DC2626',20]].map(([r,v,c,p])=>`
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:9px">
              <div style="width:160px;font-size:11.5px;color:#3D5170;flex-shrink:0">${r}</div>
              <div style="flex:1"><div class="prog-bar"><div class="prog-fill" style="width:${p*2}%;background:${c}"></div></div></div>
              <div style="font-size:11px;font-weight:700;color:${c};width:50px;text-align:right">${Number(v).toLocaleString()}</div>
            </div>`).join('')}
        </div>
        <div class="card">
          <div class="card-title">📋 Recent Results</div>
          <table><thead><tr><th>Candidate</th><th>Course</th><th>Score</th><th>Grade</th><th>Result</th></tr></thead>
          <tbody>${[['Priya Sharma','Digital Marketing',88,'Merit','Pass'],['Mohammed Ali','Electrical Tech',76,'Merit','Pass'],['Riya Patel','Healthcare Asst.',92,'Distinction','Pass'],['Arun Sinha','Construction',54,'Marginal','Pass'],['Rohit Yadav','Retail Skills',38,'—','Fail'],['Kavya Reddy','IT Support',81,'Merit','Pass']].map(([n,c,sc,g,r])=>`
            <tr>
              <td style="font-weight:600;font-size:11.5px">${n}</td>
              <td style="font-size:11px">${c}</td>
              <td style="font-weight:700;color:${sc>=75?'#007B5E':sc>=60?'#1A56C4':'#DC2626'}">${sc}</td>
              <td><span class="pill ${g==='Distinction'?'green':g==='Merit'?'blue':g==='Marginal'?'amber':'gray'}">${g}</span></td>
              <td><span class="pill ${r==='Pass'?'green':'red'}">${r}</span></td>
            </tr>`).join('')}
          </tbody></table>
        </div>
      </div>`,

    'cert-verify': `
      <div class="page-header"><h1>Certificate Verification</h1><p>Verify authenticity of issued skill certificates by ID or QR</p></div>
      <div class="kpi-grid">
        <div class="kpi" style="--c:#007B5E"><div class="val">18,240</div><div class="lbl">Verified by Employers</div></div>
        <div class="kpi" style="--c:#1A56C4"><div class="val">4,820</div><div class="lbl">Verified This Month</div></div>
        <div class="kpi" style="--c:#DC2626"><div class="val">42</div><div class="lbl">Fraud Alerts</div></div>
        <div class="kpi" style="--c:#F4A900"><div class="val">8</div><div class="lbl">Under Investigation</div></div>
      </div>
      <div class="grid2">
        <div class="card">
          <div class="card-title">🔍 Verify a Certificate</div>
          <div style="padding:4px 0">
            <label style="font-size:11px;font-weight:700;color:#3D5170;display:block;margin-bottom:5px">Certificate ID or QR Code</label>
            <input type="text" placeholder="Enter CERT-YYYY-XXXXXX" style="width:100%;margin-bottom:10px">
            <button class="action-btn btn-primary" style="width:100%;justify-content:center">🔍 Verify Certificate</button>
            <div style="margin-top:14px;padding:12px;background:#F0FDF4;border:1px solid #BBF7D0;border-radius:8px">
              <div style="font-size:11px;font-weight:700;color:#065F46;margin-bottom:8px">✅ Certificate Valid</div>
              ${[['Candidate','Priya Sharma'],['Certificate ID','CERT-2024-001821'],['Course','Digital Marketing L4'],['Issued By','WiiFlex Software Solutions'],['Issue Date','15 Dec 2024'],['Assessment Agency','Wheebox'],['NSQF Level','Level 4']].map(([l,v])=>`
                <div class="stat-row"><span class="lbl">${l}</span><span class="val">${v}</span></div>`).join('')}
            </div>
          </div>
        </div>
        <div class="card">
          <div class="card-title">🚨 Fraud Alerts</div>
          <table><thead><tr><th>Cert ID</th><th>Candidate</th><th>Issue</th><th>State</th><th>Status</th></tr></thead>
          <tbody>${[['CERT-2024-008821','Fake User A','Forged QR','UP','Under Review'],['CERT-2024-007182','Duplicate Entry','Duplicate ID','Bihar','Revoked'],['CERT-2024-006340','John Fake','Unverified Agency','MP','Under Review'],['CERT-2024-005910','Unknown','Tampered Data','UP','Revoked'],['CERT-2024-004882','Test Account','Invalid Batch','Delhi','Revoked']].map(([id,n,iss,st,s])=>`
            <tr>
              <td style="font-size:10px;color:#6B7FA3">${id}</td>
              <td style="font-weight:600;font-size:11.5px">${n}</td>
              <td style="font-size:11px;color:#DC2626">${iss}</td>
              <td>${st}</td>
              <td><span class="pill ${s==='Revoked'?'red':'amber'}">${s}</span></td>
            </tr>`).join('')}
          </tbody></table>
        </div>
      </div>`,

    badges: `
      <div class="page-header"><h1>Digital Badges</h1><p>Open Badge standard — issue, manage and verify digital skill badges</p></div>
      <div class="kpi-grid">
        <div class="kpi" style="--c:#7C3AED"><div class="val">4,820</div><div class="lbl">Badges Issued</div></div>
        <div class="kpi" style="--c:#1A56C4"><div class="val">28</div><div class="lbl">Badge Types</div></div>
        <div class="kpi" style="--c:#007B5E"><div class="val">3,240</div><div class="lbl">Shared on LinkedIn</div></div>
        <div class="kpi" style="--c:#F4A900"><div class="val">1,480</div><div class="lbl">Employer Verified</div></div>
      </div>
      <div class="grid2">
        <div class="card">
          <div class="card-title">🎖️ Badge Types</div>
          <table><thead><tr><th>Badge</th><th>Level</th><th>Issued</th><th>Criteria</th></tr></thead>
          <tbody>${[['Digital Marketing Pro','L4',820,'Assessment 75%+ & Placement'],['Healthcare Champion','L3',640,'Assessment 80%+ & 6-month placement'],['Construction Expert','L3',480,'Assessment 70%+ & site work'],['Logistics Leader','L3',320,'Assessment 75%+'],['IT Support Star','L2',560,'Assessment 70%+'],['Beauty Professional','L3',280,'Assessment 80%+'],['Master Trainer','TOT L4',120,'TOT certification + 5 batches']].map(([b,l,i,cr])=>`
            <tr>
              <td style="font-weight:600;font-size:11.5px">${b}</td>
              <td><span class="pill purple">${l}</span></td>
              <td style="text-align:center;font-weight:700;color:#7C3AED">${i}</td>
              <td style="font-size:10.5px;color:#6B7FA3">${cr}</td>
            </tr>`).join('')}
          </tbody></table>
        </div>
        <div class="card">
          <div class="card-title">📊 Badge Issuance Trend</div>
          ${[['Jan 2024',180,'#1A56C4',18],['Mar 2024',280,'#007B5E',28],['May 2024',420,'#7C3AED',42],['Jul 2024',560,'#F4A900',56],['Sep 2024',720,'#DC2626',72],['Nov 2024',860,'#0891B2',86],['Dec 2024',1800,'#007B5E',100]].map(([m,v,c,p])=>`
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:9px">
              <div style="width:80px;font-size:11px;color:#3D5170;flex-shrink:0">${m}</div>
              <div style="flex:1"><div class="prog-bar"><div class="prog-fill" style="width:${p}%;background:${c}"></div></div></div>
              <div style="font-size:11px;font-weight:700;color:${c};width:36px;text-align:right">${v}</div>
            </div>`).join('')}
        </div>
      </div>`,

    jobs: `
      <div class="page-header"><h1>Job Marketplace</h1><p>All job postings across employer partners and sectors</p></div>
      <div class="kpi-grid">
        <div class="kpi" style="--c:#1A56C4"><div class="val">12,400</div><div class="lbl">Open Jobs</div></div>
        <div class="kpi" style="--c:#007B5E"><div class="val">43,180</div><div class="lbl">Filled Positions</div></div>
        <div class="kpi" style="--c:#7C3AED"><div class="val">4,280</div><div class="lbl">Employer Partners</div></div>
        <div class="kpi" style="--c:#F4A900"><div class="val">2,840</div><div class="lbl">Applications Today</div></div>
      </div>
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <div class="card-title" style="margin:0">Job Listings</div>
          <div style="display:flex;gap:8px">
            <input type="text" placeholder="Search jobs...">
            <select><option>All Sectors</option><option>IT/ITeS</option><option>Healthcare</option><option>Construction</option></select>
            <select><option>All States</option><option>Telangana</option><option>Maharashtra</option><option>UP</option></select>
            <button class="action-btn btn-teal">📤 Export</button>
          </div>
        </div>
        <table><thead><tr><th>Job Title</th><th>Employer</th><th>Sector</th><th>Location</th><th>Salary</th><th>Applications</th><th>Posted</th><th>Status</th></tr></thead>
        <tbody>${[['Junior Software Developer','Infosys Ltd','IT / ITeS','Bangalore','₹3.2–4.8 LPA',284,'01 Jan 2025','Open'],['Healthcare Associate','Apollo Hospitals','Healthcare','Hyderabad','₹2.4–3.6 LPA',148,'02 Jan 2025','Open'],['Site Supervisor','L&T Construction','Construction','Mumbai','₹3.0–4.2 LPA',92,'28 Dec 2024','Open'],['Logistics Executive','Amazon India','Logistics','Delhi','₹2.8–3.8 LPA',210,'03 Jan 2025','Open'],['Retail Associate','Reliance Retail','Retail','Chennai','₹1.8–2.8 LPA',320,'02 Jan 2025','Open'],['Data Entry Operator','TCS BPS','IT / ITeS','Kolkata','₹2.0–3.0 LPA',186,'30 Dec 2024','Open']].map(([jt,emp,sec,loc,sal,app,p,s])=>`
          <tr>
            <td style="font-weight:600;color:#003366">${jt}</td>
            <td style="font-size:11px">${emp}</td>
            <td>${sec}</td>
            <td style="font-size:11px">${loc}</td>
            <td style="font-size:11px;color:#007B5E;font-weight:600">${sal}</td>
            <td style="text-align:center;font-weight:700;color:#1A56C4">${app}</td>
            <td style="font-size:11px;color:#6B7FA3">${p}</td>
            <td><span class="pill green">${s}</span></td>
          </tr>`).join('')}
        </tbody></table>
      </div>`,

    employers: `
      <div class="page-header"><h1>Employer Registry</h1><p>All employer partners — hiring, verification and engagement</p></div>
      <div class="kpi-grid">
        <div class="kpi" style="--c:#0891B2"><div class="val">4,280</div><div class="lbl">Total Employers</div></div>
        <div class="kpi" style="--c:#007B5E"><div class="val">3,840</div><div class="lbl">Verified</div></div>
        <div class="kpi" style="--c:#F4A900"><div class="val">320</div><div class="lbl">Pending</div></div>
        <div class="kpi" style="--c:#1A56C4"><div class="val">120</div><div class="lbl">MoU Signed</div></div>
      </div>
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <div class="card-title" style="margin:0">Employer Registry</div>
          <div style="display:flex;gap:8px">
            <input type="text" placeholder="Search employer...">
            <select><option>All Sectors</option><option>IT</option><option>Manufacturing</option><option>Healthcare</option></select>
            <button class="action-btn btn-primary">+ Add Employer</button>
            <button class="action-btn btn-teal">📤 Export</button>
          </div>
        </div>
        <table><thead><tr><th>Company</th><th>Sector</th><th>State</th><th>Open Jobs</th><th>Hires</th><th>MoU</th><th>Status</th><th>Action</th></tr></thead>
        <tbody>${[['Infosys Ltd','IT / ITeS','Karnataka',124,1840,'Yes','Verified'],['Apollo Hospitals','Healthcare','Tamil Nadu',48,620,'Yes','Verified'],['Larsen & Toubro','Construction','Maharashtra',82,940,'No','Verified'],['Amazon India','Logistics','Telangana',210,2400,'Yes','Verified'],['Reliance Retail','Retail','Gujarat',96,1120,'No','Verified'],['TCS BPS','IT / ITeS','UP',88,760,'Yes','Verified'],['Bosch India','Manufacturing','Karnataka',42,480,'Yes','Verified'],['Fortis Healthcare','Healthcare','Delhi',36,320,'No','Pending']].map(([c,sec,st,oj,h,mou,s])=>`
          <tr>
            <td style="font-weight:600;color:#003366">${c}</td>
            <td>${sec}</td>
            <td>${st}</td>
            <td style="text-align:center;color:#1A56C4;font-weight:700">${oj}</td>
            <td style="text-align:center;font-weight:700">${Number(h).toLocaleString()}</td>
            <td><span class="pill ${mou==='Yes'?'green':'gray'}">${mou}</span></td>
            <td><span class="pill ${s==='Verified'?'green':'amber'}">${s}</span></td>
            <td><button class="action-btn btn-outline" style="font-size:10px;padding:4px 9px">View</button></td>
          </tr>`).join('')}
        </tbody></table>
      </div>`,

    placements: `
      <div class="page-header"><h1>Placement Records</h1><p>All candidate placements — employer, salary and retention data</p></div>
      <div class="kpi-grid">
        <div class="kpi" style="--c:#007B5E"><div class="val">43,180</div><div class="lbl">Total Placed</div></div>
        <div class="kpi" style="--c:#1A56C4"><div class="val">67%</div><div class="lbl">Placement Rate</div></div>
        <div class="kpi" style="--c:#7C3AED"><div class="val">₹2.84 LPA</div><div class="lbl">Avg Starting Salary</div></div>
        <div class="kpi" style="--c:#F4A900"><div class="val">82%</div><div class="lbl">3-Month Retention</div></div>
      </div>
      <div class="grid2">
        <div class="card">
          <div class="card-title">📊 Placements by Sector</div>
          ${[['IT / ITeS',12400,'#1A56C4',65],['Healthcare',7200,'#007B5E',60],['Construction',6800,'#7C3AED',57],['Logistics',5400,'#F4A900',58],['Retail',4800,'#DC2626',59],['Manufacturing',3800,'#0891B2',55],['Beauty & Wellness',2780,'#007B5E',58]].map(([s,v,c,p])=>`
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:9px">
              <div style="width:120px;font-size:11.5px;color:#3D5170;flex-shrink:0">${s}</div>
              <div style="flex:1"><div class="prog-bar"><div class="prog-fill" style="width:${p}%;background:${c}"></div></div></div>
              <div style="font-size:11px;font-weight:700;color:${c};width:50px;text-align:right">${Number(v).toLocaleString()}</div>
            </div>`).join('')}
        </div>
        <div class="card">
          <div class="card-title">📋 Recent Placements</div>
          <table><thead><tr><th>Candidate</th><th>Employer</th><th>Role</th><th>Salary</th><th>Date</th></tr></thead>
          <tbody>${[['Priya Sharma','Infosys Ltd','Jr. Developer','₹3.6 LPA','Jan 2025'],['Mohammed Ali','Bosch India','Electrician','₹2.8 LPA','Jan 2025'],['Kavya Reddy','TCS BPS','Support Exec','₹2.4 LPA','Dec 2024'],['Riya Patel','Apollo Hospitals','Health Asst.','₹2.2 LPA','Dec 2024'],['Amit Singh','Amazon India','Logistics Exec','₹2.6 LPA','Dec 2024']].map(([n,emp,r,sal,d])=>`
            <tr>
              <td style="font-weight:600;font-size:11.5px">${n}</td>
              <td style="font-size:11px">${emp}</td>
              <td style="font-size:11px">${r}</td>
              <td style="font-weight:700;color:#007B5E">${sal}</td>
              <td style="font-size:11px;color:#6B7FA3">${d}</td>
            </tr>`).join('')}
          </tbody></table>
        </div>
      </div>`,

    'place-partners': `
      <div class="page-header"><h1>Placement Partners</h1><p>Staffing agencies and placement partners driving employment</p></div>
      <div class="kpi-grid">
        <div class="kpi" style="--c:#1A56C4"><div class="val">480</div><div class="lbl">Partner Agencies</div></div>
        <div class="kpi" style="--c:#007B5E"><div class="val">43,180</div><div class="lbl">Placements Made</div></div>
        <div class="kpi" style="--c:#7C3AED"><div class="val">8,400</div><div class="lbl">Active Openings</div></div>
        <div class="kpi" style="--c:#F4A900"><div class="val">38</div><div class="lbl">Pending Verification</div></div>
      </div>
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <div class="card-title" style="margin:0">Placement Partner Registry</div>
          <div style="display:flex;gap:8px">
            <input type="text" placeholder="Search partner...">
            <button class="action-btn btn-primary">+ Add Partner</button>
            <button class="action-btn btn-teal">📤 Export</button>
          </div>
        </div>
        <table><thead><tr><th>Agency</th><th>Sector Focus</th><th>State</th><th>Placements</th><th>Openings</th><th>Avg Salary</th><th>Rating</th><th>Status</th></tr></thead>
        <tbody>${[['TeamLease Services','Multi-sector','Karnataka',4800,320,'₹2.8 LPA','4.6/5','Active'],['Randstad India','IT & BPO','Maharashtra',3200,240,'₹3.2 LPA','4.4/5','Active'],['Mafoi Management','Manufacturing','Tamil Nadu',2800,180,'₹2.6 LPA','4.2/5','Active'],['Quess Corp','Retail & Logistics','Telangana',3600,280,'₹2.4 LPA','4.5/5','Active'],['IKYA Human Capital','Healthcare','Delhi',2100,160,'₹2.2 LPA','4.3/5','Active'],['ABC Placement','Construction','Rajasthan',1200,80,'₹2.4 LPA','3.9/5','Active']].map(([a,s,st,pl,op,sal,rat,status])=>`
          <tr>
            <td style="font-weight:600;color:#003366">${a}</td>
            <td style="font-size:11px">${s}</td>
            <td>${st}</td>
            <td style="text-align:center;font-weight:700">${Number(pl).toLocaleString()}</td>
            <td style="text-align:center;color:#1A56C4;font-weight:700">${op}</td>
            <td style="color:#007B5E;font-weight:600">${sal}</td>
            <td style="font-weight:700;color:#007B5E">${rat}</td>
            <td><span class="pill green">${status}</span></td>
          </tr>`).join('')}
        </tbody></table>
      </div>`,

    'emp-verify': `
      <div class="page-header"><h1>Employment Verification</h1><p>Verify and track actual employment status of placed candidates</p></div>
      <div class="kpi-grid">
        <div class="kpi" style="--c:#007B5E"><div class="val">38,420</div><div class="lbl">Verified Employed</div></div>
        <div class="kpi" style="--c:#F4A900"><div class="val">4,760</div><div class="lbl">Pending Verification</div></div>
        <div class="kpi" style="--c:#DC2626"><div class="val">2,840</div><div class="lbl">No Longer Employed</div></div>
        <div class="kpi" style="--c:#1A56C4"><div class="val">82%</div><div class="lbl">3-Month Retention</div></div>
      </div>
      <div class="grid2">
        <div class="card">
          <div class="card-title">✔️ Recent Verifications</div>
          <table><thead><tr><th>Candidate</th><th>Employer</th><th>Role</th><th>Verified On</th><th>Status</th></tr></thead>
          <tbody>${[['Priya Sharma','Infosys Ltd','Jr. Developer','03 Jan 2025','Employed'],['Mohammed Ali','Bosch India','Electrician','02 Jan 2025','Employed'],['Kavya Reddy','TCS BPS','Support Exec','01 Jan 2025','Employed'],['Riya Patel','Apollo Hospitals','Health Asst.','31 Dec 2024','Employed'],['Rohit Kumar','Amazon India','Exec','30 Dec 2024','Left Job'],['Sunita Devi','Reliance Retail','Associate','29 Dec 2024','Employed']].map(([n,emp,r,d,s])=>`
            <tr>
              <td style="font-weight:600;font-size:11.5px">${n}</td>
              <td style="font-size:11px">${emp}</td>
              <td style="font-size:11px">${r}</td>
              <td style="font-size:11px;color:#6B7FA3">${d}</td>
              <td><span class="pill ${s==='Employed'?'green':'red'}">${s}</span></td>
            </tr>`).join('')}
          </tbody></table>
        </div>
        <div class="card">
          <div class="card-title">📊 Retention by Scheme</div>
          ${[['PMKVY 4.0','86%','#007B5E',86],['DDU-GKY','81%','#1A56C4',81],['NAPS','88%','#7C3AED',88],['State Skill Mission','79%','#F4A900',79],['CSR Programs','84%','#DC2626',84],['Fee-Based','91%','#0891B2',91]].map(([s,v,c,p])=>`
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
              <div style="width:130px;font-size:11.5px;color:#3D5170;flex-shrink:0">${s}</div>
              <div style="flex:1"><div class="prog-bar" style="height:8px"><div class="prog-fill" style="width:${p}%;background:${c}"></div></div></div>
              <div style="font-size:12px;font-weight:700;color:${c};width:36px;text-align:right">${v}</div>
            </div>`).join('')}
        </div>
      </div>`,

    apprentice: `
      <div class="page-header"><h1>Apprenticeship Portal</h1><p>Manage apprenticeship contracts, stipends and completions</p></div>
      <div class="kpi-grid">
        <div class="kpi" style="--c:#1A56C4"><div class="val">18,900</div><div class="lbl">Active Apprentices</div></div>
        <div class="kpi" style="--c:#007B5E"><div class="val">14,200</div><div class="lbl">Completed</div></div>
        <div class="kpi" style="--c:#7C3AED"><div class="val">2,840</div><div class="lbl">Employer Partners</div></div>
        <div class="kpi" style="--c:#F4A900"><div class="val">₹28.4 Cr</div><div class="lbl">Stipend Disbursed</div></div>
      </div>
      <div class="grid2">
        <div class="card">
          <div class="card-title">📋 Active Apprenticeships</div>
          <table><thead><tr><th>Apprentice</th><th>Employer</th><th>Trade</th><th>Start</th><th>Duration</th><th>Status</th></tr></thead>
          <tbody>${[['Arun Mehta','Maruti Suzuki','Automotive Mechanic','Apr 2024','12 months','Active'],['Sunita Rao','Bosch India','Electronics Tech','Jun 2024','18 months','Active'],['Ravi Patel','L&T','Civil Construction','Jul 2024','24 months','Active'],['Preet Kaur','TCS','IT Support','Aug 2024','12 months','Active'],['Deepak Singh','Amazon','Warehouse Ops','Sep 2024','12 months','Active']].map(([n,emp,tr,sd,dur,s])=>`
            <tr>
              <td style="font-weight:600;font-size:11.5px">${n}</td>
              <td style="font-size:11px">${emp}</td>
              <td style="font-size:11px">${tr}</td>
              <td style="font-size:11px;color:#6B7FA3">${sd}</td>
              <td style="font-size:11px">${dur}</td>
              <td><span class="pill green">${s}</span></td>
            </tr>`).join('')}
          </tbody></table>
        </div>
        <div class="card">
          <div class="card-title">💵 Stipend Summary</div>
          ${[['Total Stipend Committed','₹48.0 Cr'],['Govt Share (25%)','₹12.0 Cr'],['Employer Share (75%)','₹36.0 Cr'],['Disbursed to Date','₹28.4 Cr'],['Pending Disbursement','₹19.6 Cr'],['Avg Stipend / Month','₹4,200'],['Processing Time','3–5 working days']].map(([l,v])=>`
            <div class="stat-row"><span class="lbl">${l}</span><span class="val">${v}</span></div>`).join('')}
          <button class="action-btn btn-primary" style="margin-top:14px;width:100%;justify-content:center">💸 Process Stipends</button>
        </div>
      </div>`,

    'fund-alloc': `
      <div class="page-header"><h1>Fund Allocation</h1><p>Scheme-wise and state-wise fund allocation and utilisation</p></div>
      <div class="kpi-grid">
        <div class="kpi" style="--c:#003366"><div class="val">₹480 Cr</div><div class="lbl">Total Budget FY25</div></div>
        <div class="kpi" style="--c:#007B5E"><div class="val">₹284 Cr</div><div class="lbl">Allocated</div></div>
        <div class="kpi" style="--c:#1A56C4"><div class="val">₹196 Cr</div><div class="lbl">Utilised</div></div>
        <div class="kpi" style="--c:#F4A900"><div class="val">69%</div><div class="lbl">Utilisation Rate</div></div>
      </div>
      <div class="grid2">
        <div class="card">
          <div class="card-title">🏛️ Scheme-wise Allocation</div>
          <table><thead><tr><th>Scheme</th><th>Allocated</th><th>Utilised</th><th>%</th><th>Status</th></tr></thead>
          <tbody>${[['PMKVY 4.0','₹124 Cr','₹84.2 Cr','68%','On Track'],['DDU-GKY','₹68 Cr','₹42.8 Cr','63%','On Track'],['NAPS','₹48 Cr','₹28.4 Cr','59%','Review'],['State Skill Mission','₹36.4 Cr','₹24.2 Cr','66%','On Track'],['CSR Programs','₹4.8 Cr','₹3.2 Cr','67%','On Track'],['Fee-Based','₹2.8 Cr','₹13.2 Cr','—','Revenue']].map(([s,al,ut,p,st])=>`
            <tr>
              <td style="font-weight:600">${s}</td>
              <td style="font-weight:700;color:#1A56C4">${al}</td>
              <td style="font-weight:700;color:#007B5E">${ut}</td>
              <td style="font-weight:700">${p}</td>
              <td><span class="pill ${st==='On Track'?'green':st==='Review'?'amber':'blue'}">${st}</span></td>
            </tr>`).join('')}
          </tbody></table>
        </div>
        <div class="card">
          <div class="card-title">🗺️ Top States by Allocation</div>
          ${[['Uttar Pradesh','₹48.2 Cr','#1A56C4',48],['Maharashtra','₹36.4 Cr','#007B5E',36],['Rajasthan','₹28.8 Cr','#7C3AED',29],['Bihar','₹24.4 Cr','#F4A900',24],['Telangana','₹22.0 Cr','#DC2626',22],['Karnataka','₹18.4 Cr','#0891B2',18],['Gujarat','₹16.8 Cr','#007B5E',17]].map(([s,v,c,p])=>`
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:9px">
              <div style="width:110px;font-size:11.5px;color:#3D5170;flex-shrink:0">${s}</div>
              <div style="flex:1"><div class="prog-bar"><div class="prog-fill" style="width:${p*2}%;background:${c}"></div></div></div>
              <div style="font-size:11px;font-weight:700;color:${c};width:60px;text-align:right">${v}</div>
            </div>`).join('')}
        </div>
      </div>`,

    disbursements: `
      <div class="page-header"><h1>Disbursements</h1><p>Fund disbursements to training partners and stipend payments</p></div>
      <div class="kpi-grid">
        <div class="kpi" style="--c:#007B5E"><div class="val">₹196 Cr</div><div class="lbl">Total Disbursed</div></div>
        <div class="kpi" style="--c:#F4A900"><div class="val">₹88 Cr</div><div class="lbl">Pending</div></div>
        <div class="kpi" style="--c:#1A56C4"><div class="val">4,280</div><div class="lbl">Transactions</div></div>
        <div class="kpi" style="--c:#DC2626"><div class="val">24</div><div class="lbl">Failed / Returned</div></div>
      </div>
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <div class="card-title" style="margin:0">Disbursement Transactions</div>
          <div style="display:flex;gap:8px">
            <select><option>All Schemes</option><option>PMKVY 4.0</option><option>DDU-GKY</option><option>NAPS</option></select>
            <input type="date">
            <button class="action-btn btn-primary">+ New Disbursement</button>
            <button class="action-btn btn-teal">📤 Export</button>
          </div>
        </div>
        <table><thead><tr><th>Txn ID</th><th>Recipient</th><th>Scheme</th><th>Amount</th><th>Bank</th><th>Date</th><th>Status</th></tr></thead>
        <tbody>${[['TXN-2025-0481','WiiFlex Pvt Ltd','PMKVY 4.0','₹18.4 L','SBI','04 Jan 2025','Success'],['TXN-2025-0480','SkillUp India','DDU-GKY','₹12.2 L','HDFC','04 Jan 2025','Success'],['TXN-2025-0479','Rural Skill Dev','DDU-GKY','₹8.8 L','PNB','03 Jan 2025','Success'],['TXN-2025-0478','TechLearn Academy','PMKVY 4.0','₹6.4 L','Axis','03 Jan 2025','Pending'],['TXN-2025-0477','Udyam Skill','NAPS','₹4.2 L','UCO Bank','02 Jan 2025','Failed'],['TXN-2025-0476','FutureTech Inst.','PMKVY 4.0','₹9.6 L','SBI','02 Jan 2025','Success']].map(([id,r,sc,amt,b,d,s])=>`
          <tr>
            <td style="font-size:10.5px;color:#6B7FA3">${id}</td>
            <td style="font-weight:600">${r}</td>
            <td><span class="pill blue" style="font-size:9px">${sc}</span></td>
            <td style="font-weight:700;color:#007B5E">${amt}</td>
            <td style="font-size:11px">${b}</td>
            <td style="font-size:11px;color:#6B7FA3">${d}</td>
            <td><span class="pill ${s==='Success'?'green':s==='Pending'?'amber':'red'}">${s}</span></td>
          </tr>`).join('')}
        </tbody></table>
      </div>`,

    claims: `
      <div class="page-header"><h1>Training Cost Claims</h1><p>Training partner reimbursement claims — review, approve and process</p></div>
      <div class="kpi-grid">
        <div class="kpi" style="--c:#F4A900"><div class="val">284</div><div class="lbl">Pending Claims</div></div>
        <div class="kpi" style="--c:#007B5E"><div class="val">1,840</div><div class="lbl">Approved</div></div>
        <div class="kpi" style="--c:#DC2626"><div class="val">48</div><div class="lbl">Rejected</div></div>
        <div class="kpi" style="--c:#1A56C4"><div class="val">₹196 Cr</div><div class="lbl">Total Claimed</div></div>
      </div>
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <div class="card-title" style="margin:0">Claim Requests</div>
          <div style="display:flex;gap:8px">
            <select><option>All Status</option><option>Pending</option><option>Approved</option><option>Rejected</option></select>
            <select><option>All Schemes</option><option>PMKVY 4.0</option><option>DDU-GKY</option></select>
            <button class="action-btn btn-teal">📤 Export</button>
          </div>
        </div>
        <table><thead><tr><th>Claim ID</th><th>Partner</th><th>Scheme</th><th>Trainees</th><th>Amount</th><th>Submitted</th><th>Status</th><th>Action</th></tr></thead>
        <tbody>${[['CLM-2025-0281','WiiFlex Pvt Ltd','PMKVY 4.0',42,'₹52.1 L','03 Jan 2025','Pending'],['CLM-2025-0280','SkillUp India','DDU-GKY',38,'₹54.0 L','02 Jan 2025','Pending'],['CLM-2025-0279','Rural Skill Dev','DDU-GKY',45,'₹63.9 L','01 Jan 2025','Approved'],['CLM-2025-0278','TechLearn Academy','PMKVY 4.0',36,'₹44.6 L','31 Dec 2024','Approved'],['CLM-2025-0277','FutureTech','NAPS',0,'₹0','30 Dec 2024','Rejected']].map(([id,p,sc,tr,amt,sub,s])=>`
          <tr>
            <td style="font-size:10.5px;color:#6B7FA3">${id}</td>
            <td style="font-weight:600">${p}</td>
            <td><span class="pill blue" style="font-size:9px">${sc}</span></td>
            <td style="text-align:center">${tr}</td>
            <td style="font-weight:700;color:#007B5E">${amt}</td>
            <td style="font-size:11px;color:#6B7FA3">${sub}</td>
            <td><span class="pill ${s==='Approved'?'green':s==='Pending'?'amber':'red'}">${s}</span></td>
            <td>
              ${s==='Pending'?`<div style="display:flex;gap:4px"><button class="action-btn btn-teal" style="font-size:10px;padding:3px 8px">✓</button><button class="action-btn btn-danger" style="font-size:10px;padding:3px 8px">✗</button></div>`:`<button class="action-btn btn-outline" style="font-size:10px;padding:4px 9px">View</button>`}
            </td>
          </tr>`).join('')}
        </tbody></table>
      </div>`,

    'scheme-budget': `
      <div class="page-header"><h1>Scheme-wise Budgets</h1><p>Budget allocation, utilisation and variance by scheme</p></div>
      <div class="kpi-grid">
        <div class="kpi" style="--c:#003366"><div class="val">₹480 Cr</div><div class="lbl">Total Budget FY25</div></div>
        <div class="kpi" style="--c:#1A56C4"><div class="val">₹284 Cr</div><div class="lbl">Allocated</div></div>
        <div class="kpi" style="--c:#007B5E"><div class="val">₹196 Cr</div><div class="lbl">Utilised</div></div>
        <div class="kpi" style="--c:#F4A900"><div class="val">₹88 Cr</div><div class="lbl">Remaining</div></div>
      </div>
      <div class="card">
        <div class="card-title">📊 Scheme Budget Tracker</div>
        ${[['PMKVY 4.0','₹124 Cr','₹84.2 Cr',68,'#003366'],['DDU-GKY','₹68 Cr','₹42.8 Cr',63,'#007B5E'],['NAPS','₹48 Cr','₹28.4 Cr',59,'#1A56C4'],['State Skill Mission','₹36.4 Cr','₹24.2 Cr',66,'#7C3AED'],['CSR Programs','₹4.8 Cr','₹3.2 Cr',67,'#F4A900'],['Fee-Based','₹2.8 Cr','Revenue','—','#DC2626']].map(([s,al,ut,p,c])=>`
          <div style="margin-bottom:16px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
              <span style="font-size:12px;font-weight:700;color:#1A2B4A">${s}</span>
              <span style="font-size:11px;color:#6B7FA3">${ut} of ${al} &nbsp;<strong style="color:${c}">${typeof p==='number'?p+'%':p}</strong></span>
            </div>
            <div class="prog-bar" style="height:10px">
              <div class="prog-fill" style="width:${typeof p==='number'?p:0}%;background:${c}"></div>
            </div>
          </div>`).join('')}
      </div>
      <div class="card" style="margin-top:14px">
        <div class="card-title">📋 Budget vs Actuals (Q3 FY2024-25)</div>
        <table><thead><tr><th>Scheme</th><th>Q3 Budget</th><th>Q3 Actual</th><th>Variance</th><th>Status</th></tr></thead>
        <tbody>${[['PMKVY 4.0','₹31 Cr','₹28.4 Cr','-₹2.6 Cr','Under Budget'],['DDU-GKY','₹17 Cr','₹16.2 Cr','-₹0.8 Cr','Under Budget'],['NAPS','₹12 Cr','₹13.4 Cr','+₹1.4 Cr','Over Budget'],['State Skill Mission','₹9.1 Cr','₹8.8 Cr','-₹0.3 Cr','Under Budget']].map(([s,b,a,v,st])=>`
          <tr>
            <td style="font-weight:600">${s}</td>
            <td style="font-weight:700;color:#1A56C4">${b}</td>
            <td style="font-weight:700;color:#007B5E">${a}</td>
            <td style="font-weight:700;color:${v.startsWith('+')?'#DC2626':'#007B5E'}">${v}</td>
            <td><span class="pill ${st==='Under Budget'?'green':'red'}">${st}</span></td>
          </tr>`).join('')}
        </tbody></table>
      </div>`,

    'fin-audit': `
      <div class="page-header"><h1>Audit & Compliance</h1><p>Financial audit reports, compliance checks and irregularity flags</p></div>
      <div class="kpi-grid">
        <div class="kpi" style="--c:#007B5E"><div class="val">92%</div><div class="lbl">Compliance Rate</div></div>
        <div class="kpi" style="--c:#F4A900"><div class="val">48</div><div class="lbl">Open Audit Items</div></div>
        <div class="kpi" style="--c:#DC2626"><div class="val">12</div><div class="lbl">Critical Flags</div></div>
        <div class="kpi" style="--c:#1A56C4"><div class="val">₹17.4 Cr</div><div class="lbl">Under Audit</div></div>
      </div>
      <div class="grid2">
        <div class="card">
          <div class="card-title">🔎 Audit Findings</div>
          <table><thead><tr><th>Partner</th><th>Issue</th><th>Amount</th><th>Severity</th><th>Status</th></tr></thead>
          <tbody>${[['Rural Skill Dev Society','Attendance mismatch','₹4.2 L','High','Under Review'],['FutureTech Institute','Ghost trainees found','₹8.8 L','Critical','Investigation'],['Udyam Skill Centre','Duplicate claims','₹2.4 L','Medium','Resolved'],['Disha Foundation','Missing documents','₹1.8 L','Low','Pending'],['Prerna Skill Centre','Inflated costs','₹6.2 L','High','Under Review']].map(([p,iss,amt,sev,s])=>`
            <tr>
              <td style="font-weight:600;font-size:11.5px">${p}</td>
              <td style="font-size:11px">${iss}</td>
              <td style="font-weight:700;color:#DC2626">${amt}</td>
              <td><span class="pill ${sev==='Critical'?'red':sev==='High'?'amber':sev==='Medium'?'blue':'gray'}">${sev}</span></td>
              <td><span class="pill ${s==='Resolved'?'green':s==='Investigation'?'red':'amber'}">${s}</span></td>
            </tr>`).join('')}
          </tbody></table>
        </div>
        <div class="card">
          <div class="card-title">📋 Compliance Checklist</div>
          ${[['Attendance records verified','✅ Compliant'],['Trainer certification valid','✅ Compliant'],['Center infrastructure audit','✅ Compliant'],['Assessment agency empanelled','✅ Compliant'],['Bank account validation','⚠️ 3 Partners Pending'],['Geo-tagging of centers','⚠️ 12 Centers Pending'],['Aadhaar seeding complete','❌ 8% Incomplete'],['3rd party audit done','✅ Compliant']].map(([item,status])=>`
            <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #F1F5F9">
              <span style="font-size:12px;color:#3D5170">${item}</span>
              <span style="font-size:11.5px;font-weight:700;color:${status.startsWith('✅')?'#007B5E':status.startsWith('⚠️')?'#D97706':'#DC2626'}">${status}</span>
            </div>`).join('')}
        </div>
      </div>`,

    'pay-reports': `
      <div class="page-header"><h1>Payment Reports</h1><p>Comprehensive payment and transaction reports across schemes</p></div>
      <div class="kpi-grid">
        <div class="kpi" style="--c:#007B5E"><div class="val">₹196 Cr</div><div class="lbl">Total Payments FY25</div></div>
        <div class="kpi" style="--c:#1A56C4"><div class="val">4,280</div><div class="lbl">Transactions</div></div>
        <div class="kpi" style="--c:#F4A900"><div class="val">₹88 Cr</div><div class="lbl">Pending Release</div></div>
        <div class="kpi" style="--c:#DC2626"><div class="val">24</div><div class="lbl">Failed Transactions</div></div>
      </div>
      <div class="grid2">
        <div class="card">
          <div class="card-title">📑 Available Reports</div>
          ${[['Monthly Payment Summary','Dec 2024','PDF / Excel'],['Scheme-wise Disbursement','Q3 FY2024-25','Excel'],['Partner Payment Ledger','Dec 2024','Excel'],['Stipend Payment Report','Dec 2024','PDF'],['Failed Transactions Log','Dec 2024','CSV'],['Bank Reconciliation','Nov 2024','Excel'],['GST / TDS Report','Q3 FY2024-25','PDF']].map(([n,p,f])=>`
            <div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid #F1F5F9">
              <div style="font-size:18px">📄</div>
              <div style="flex:1">
                <div style="font-size:12px;font-weight:600;color:#1A2B4A">${n}</div>
                <div style="font-size:10px;color:#6B7FA3">${p} · ${f}</div>
              </div>
              <button class="action-btn btn-outline" style="font-size:10px;padding:4px 9px">📥 Download</button>
            </div>`).join('')}
        </div>
        <div class="card">
          <div class="card-title">📊 Monthly Payment Trend</div>
          ${[['Apr 2024','₹14.2 Cr','#1A56C4',42],['May 2024','₹16.8 Cr','#007B5E',50],['Jun 2024','₹18.4 Cr','#7C3AED',55],['Jul 2024','₹22.0 Cr','#F4A900',66],['Aug 2024','₹24.8 Cr','#DC2626',74],['Sep 2024','₹19.6 Cr','#0891B2',59],['Oct 2024','₹26.4 Cr','#007B5E',79],['Nov 2024','₹28.8 Cr','#1A56C4',86],['Dec 2024','₹24.6 Cr','#7C3AED',74]].map(([m,v,c,p])=>`
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
              <div style="width:70px;font-size:11px;color:#3D5170;flex-shrink:0">${m}</div>
              <div style="flex:1"><div class="prog-bar"><div class="prog-fill" style="width:${p}%;background:${c}"></div></div></div>
              <div style="font-size:11px;font-weight:700;color:${c};width:64px;text-align:right">${v}</div>
            </div>`).join('')}
        </div>
      </div>`,

    'sector-rpt': `
      <div class="page-header"><h1>Sector-wise Reports</h1><p>Training and placement performance broken down by industry sector</p></div>
      <div class="kpi-grid">
        <div class="kpi" style="--c:#1A56C4"><div class="val">24</div><div class="lbl">Sectors Covered</div></div>
        <div class="kpi" style="--c:#007B5E"><div class="val">IT / ITeS</div><div class="lbl">Top Sector</div></div>
        <div class="kpi" style="--c:#7C3AED"><div class="val">78%</div><div class="lbl">Highest Placement Rate</div></div>
        <div class="kpi" style="--c:#F4A900"><div class="val">Agriculture</div><div class="lbl">Fastest Growing</div></div>
      </div>
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <div class="card-title" style="margin:0">Sector Performance Report</div>
          <div style="display:flex;gap:8px">
            <select><option>FY 2024-25</option><option>FY 2023-24</option></select>
            <select><option>Q3 (Oct–Dec)</option><option>Q2 (Jul–Sep)</option><option>Q1 (Apr–Jun)</option></select>
            <button class="action-btn btn-teal">📤 Export</button>
          </div>
        </div>
        <table><thead><tr><th>Sector</th><th>Partners</th><th>Trainees</th><th>Certified</th><th>Placed</th><th>Avg Salary</th><th>Placement Rate</th></tr></thead>
        <tbody>${[['IT / ITeS',420,28400,24200,18400,'₹3.8 LPA','78%'],['Healthcare',280,18200,15400,10900,'₹2.6 LPA','72%'],['Construction',360,12800,10200,7100,'₹2.4 LPA','70%'],['Logistics',240,9400,7800,5600,'₹2.4 LPA','72%'],['Retail',320,8100,6800,4800,'₹1.9 LPA','71%'],['Agriculture',180,6200,5100,3400,'₹1.8 LPA','67%'],['Beauty & Wellness',160,4800,4100,2900,'₹2.1 LPA','71%'],['Automotive',140,3800,3200,2400,'₹2.6 LPA','75%']].map(([sec,p,tr,cert,pl,sal,plr])=>`
          <tr>
            <td style="font-weight:600;color:#003366">${sec}</td>
            <td style="text-align:center">${p}</td>
            <td style="text-align:center">${Number(tr).toLocaleString()}</td>
            <td style="text-align:center">${Number(cert).toLocaleString()}</td>
            <td style="text-align:center;font-weight:700;color:#007B5E">${Number(pl).toLocaleString()}</td>
            <td style="color:#007B5E;font-weight:600">${sal}</td>
            <td style="font-weight:700;color:#1A56C4">${plr}</td>
          </tr>`).join('')}
        </tbody></table>
      </div>`,

    'state-rpt': `
      <div class="page-header"><h1>State-wise Reports</h1><p>Training and placement performance across all states and UTs</p></div>
      <div class="kpi-grid">
        <div class="kpi" style="--c:#1A56C4"><div class="val">28</div><div class="lbl">States Active</div></div>
        <div class="kpi" style="--c:#007B5E"><div class="val">Telangana</div><div class="lbl">Top Performer</div></div>
        <div class="kpi" style="--c:#7C3AED"><div class="val">UP</div><div class="lbl">Highest Volume</div></div>
        <div class="kpi" style="--c:#F4A900"><div class="val">8</div><div class="lbl">States Below Target</div></div>
      </div>
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <div class="card-title" style="margin:0">State Performance Report</div>
          <div style="display:flex;gap:8px">
            <select><option>FY 2024-25</option><option>FY 2023-24</option></select>
            <select><option>All Schemes</option><option>PMKVY 4.0</option><option>DDU-GKY</option></select>
            <button class="action-btn btn-teal">📤 Export</button>
          </div>
        </div>
        <table><thead><tr><th>State</th><th>Partners</th><th>Centers</th><th>Trainees</th><th>Certified</th><th>Placed</th><th>Placement Rate</th><th>Grade</th></tr></thead>
        <tbody>${[['Uttar Pradesh',380,820,28400,22100,16800,'59%','B+'],['Maharashtra',320,640,22800,19200,14400,'63%','A'],['Rajasthan',220,520,14200,11800,8400,'59%','B+'],['Telangana',180,480,12800,11200,9600,'75%','A+'],['Karnataka',200,420,12400,10400,8200,'66%','A'],['Gujarat',160,380,10200,8400,6400,'63%','A'],['Bihar',240,280,9800,7400,5200,'53%','B'],['Madhya Pradesh',180,240,8600,6800,4800,'56%','B']].map(([st,p,c,tr,cert,pl,plr,g])=>`
          <tr>
            <td style="font-weight:600;color:#003366">${st}</td>
            <td style="text-align:center">${p}</td>
            <td style="text-align:center">${c}</td>
            <td style="text-align:center">${Number(tr).toLocaleString()}</td>
            <td style="text-align:center">${Number(cert).toLocaleString()}</td>
            <td style="text-align:center;font-weight:700;color:#007B5E">${Number(pl).toLocaleString()}</td>
            <td style="font-weight:700;color:#1A56C4">${plr}</td>
            <td><span class="pill ${g==='A+'?'green':g==='A'?'blue':g==='B+'?'amber':'gray'}">${g}</span></td>
          </tr>`).join('')}
        </tbody></table>
      </div>`,

    'scheme-rpt': `
      <div class="page-header"><h1>Scheme Reports</h1><p>Performance and financial reports for all government skill schemes</p></div>
      <div class="kpi-grid">
        <div class="kpi" style="--c:#1A56C4"><div class="val">6</div><div class="lbl">Active Schemes</div></div>
        <div class="kpi" style="--c:#007B5E"><div class="val">PMKVY 4.0</div><div class="lbl">Largest Scheme</div></div>
        <div class="kpi" style="--c:#7C3AED"><div class="val">NAPS</div><div class="lbl">Best Placement Rate</div></div>
        <div class="kpi" style="--c:#F4A900"><div class="val">69%</div><div class="lbl">Overall Achievement</div></div>
      </div>
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <div class="card-title" style="margin:0">Scheme Performance Summary</div>
          <div style="display:flex;gap:8px">
            <select><option>FY 2024-25</option><option>FY 2023-24</option></select>
            <button class="action-btn btn-teal">📤 Export All</button>
          </div>
        </div>
        <table><thead><tr><th>Scheme</th><th>Target</th><th>Enrolled</th><th>Certified</th><th>Placed</th><th>Budget</th><th>Utilised</th><th>Achievement</th></tr></thead>
        <tbody>${[['PMKVY 4.0',60000,48240,38120,29800,'₹124 Cr','₹84.2 Cr','80%'],['DDU-GKY',30000,22180,17440,14200,'₹68 Cr','₹42.8 Cr','74%'],['NAPS',25000,18900,14200,13100,'₹48 Cr','₹28.4 Cr','76%'],['State Skill Mission',35000,21300,16800,10900,'₹36.4 Cr','₹24.2 Cr','61%'],['CSR Programs',15000,8200,6440,4820,'₹4.8 Cr','₹3.2 Cr','55%'],['Fee-Based',15000,6000,5200,2980,'—','₹18.4 Cr Rev.','40%']].map(([sc,t,e,c,p,b,u,ach])=>`
          <tr>
            <td style="font-weight:600;color:#003366">${sc}</td>
            <td style="text-align:center">${Number(t).toLocaleString()}</td>
            <td style="text-align:center">${Number(e).toLocaleString()}</td>
            <td style="text-align:center">${Number(c).toLocaleString()}</td>
            <td style="text-align:center;font-weight:700;color:#007B5E">${Number(p).toLocaleString()}</td>
            <td style="color:#1A56C4;font-weight:600">${b}</td>
            <td style="color:#007B5E;font-weight:600">${u}</td>
            <td style="font-weight:700;color:${parseInt(ach)>=70?'#007B5E':parseInt(ach)>=55?'#F4A900':'#DC2626'}">${ach}</td>
          </tr>`).join('')}
        </tbody></table>
      </div>`,

    'place-analytics': `
      <div class="page-header"><h1>Placement Analytics</h1><p>Deep-dive analytics on candidate placement trends and employer demand</p></div>
      <div class="kpi-grid">
        <div class="kpi" style="--c:#007B5E"><div class="val">67%</div><div class="lbl">Overall Placement Rate</div></div>
        <div class="kpi" style="--c:#1A56C4"><div class="val">₹2.84 LPA</div><div class="lbl">Avg Starting Salary</div></div>
        <div class="kpi" style="--c:#7C3AED"><div class="val">82%</div><div class="lbl">3-Month Retention</div></div>
        <div class="kpi" style="--c:#F4A900"><div class="val">18 days</div><div class="lbl">Avg Time to Placement</div></div>
      </div>
      <div class="grid2">
        <div class="card">
          <div class="card-title">📈 Placement Rate by Sector</div>
          ${[['IT / ITeS','78%','#1A56C4',78],['Automotive','75%','#007B5E',75],['Healthcare','72%','#7C3AED',72],['Logistics','72%','#F4A900',72],['Retail','71%','#DC2626',71],['Beauty & Wellness','71%','#0891B2',71],['Construction','70%','#003366',70],['Agriculture','67%','#007B5E',67]].map(([s,v,c,p])=>`
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:9px">
              <div style="width:120px;font-size:11.5px;color:#3D5170;flex-shrink:0">${s}</div>
              <div style="flex:1"><div class="prog-bar"><div class="prog-fill" style="width:${p}%;background:${c}"></div></div></div>
              <div style="font-size:12px;font-weight:700;color:${c};width:36px;text-align:right">${v}</div>
            </div>`).join('')}
        </div>
        <div class="card">
          <div class="card-title">💰 Salary Distribution</div>
          ${[['Below ₹1.5 LPA',4200,'#DC2626',10],['₹1.5–2.0 LPA',8400,'#F4A900',19],['₹2.0–2.5 LPA',12600,'#0891B2',29],['₹2.5–3.0 LPA',9800,'#1A56C4',23],['₹3.0–4.0 LPA',5600,'#007B5E',13],['Above ₹4.0 LPA',2580,'#7C3AED',6]].map(([r,v,c,p])=>`
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:9px">
              <div style="width:130px;font-size:11px;color:#3D5170;flex-shrink:0">${r}</div>
              <div style="flex:1"><div class="prog-bar"><div class="prog-fill" style="width:${p*2}%;background:${c}"></div></div></div>
              <div style="font-size:11px;font-weight:700;color:${c};width:50px;text-align:right">${Number(v).toLocaleString()}</div>
            </div>`).join('')}
        </div>
      </div>
      <div class="card">
        <div class="card-title">🏢 Top Hiring Employers</div>
        <table><thead><tr><th>Employer</th><th>Sector</th><th>Hires</th><th>Avg Salary</th><th>Retention</th></tr></thead>
        <tbody>${[['Infosys Ltd','IT / ITeS',1840,'₹3.6 LPA','91%'],['Amazon India','Logistics',2400,'₹2.6 LPA','84%'],['Apollo Hospitals','Healthcare',620,'₹2.2 LPA','88%'],['Reliance Retail','Retail',1120,'₹1.9 LPA','79%'],['L&T Construction','Construction',940,'₹2.4 LPA','82%'],['TCS BPS','IT / ITeS',760,'₹2.4 LPA','87%']].map(([e,s,h,sal,ret])=>`
          <tr>
            <td style="font-weight:600">${e}</td>
            <td>${s}</td>
            <td style="text-align:center;font-weight:700;color:#1A56C4">${Number(h).toLocaleString()}</td>
            <td style="color:#007B5E;font-weight:600">${sal}</td>
            <td style="font-weight:700;color:${parseInt(ret)>=85?'#007B5E':'#F4A900'}">${ret}</td>
          </tr>`).join('')}
        </tbody></table>
      </div>`,

    export: `
      <div class="page-header"><h1>Export Centre</h1><p>Download platform data, reports and MIS outputs in multiple formats</p></div>
      <div class="kpi-grid">
        <div class="kpi" style="--c:#1A56C4"><div class="val">284</div><div class="lbl">Reports Generated</div></div>
        <div class="kpi" style="--c:#007B5E"><div class="val">48</div><div class="lbl">Scheduled Exports</div></div>
        <div class="kpi" style="--c:#7C3AED"><div class="val">12</div><div class="lbl">Auto-email Reports</div></div>
        <div class="kpi" style="--c:#F4A900"><div class="val">3.2 GB</div><div class="lbl">Data Exported FY25</div></div>
      </div>
      <div class="grid2">
        <div class="card">
          <div class="card-title">📤 Quick Export</div>
          ${[['MIS Monthly Report','Full platform metrics','PDF / Excel / CSV'],['Candidate Registry','All candidates with status','CSV / Excel'],['Placement Report','Placed candidates & employer','Excel'],['Financial Summary','Disbursements & claims','PDF / Excel'],['Trainer Registry','All trainers & assessors','CSV'],['Certificate Log','All issued certificates','CSV'],['Attendance Summary','Batch-wise attendance','Excel'],['Audit Trail','Complete activity log','CSV']].map(([t,d,f])=>`
            <div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid #F1F5F9">
              <div style="flex:1">
                <div style="font-size:12px;font-weight:600;color:#1A2B4A">${t}</div>
                <div style="font-size:10px;color:#6B7FA3">${d} · ${f}</div>
              </div>
              <button class="action-btn btn-teal" style="font-size:10px;padding:4px 9px">📥 Export</button>
            </div>`).join('')}
        </div>
        <div class="card">
          <div class="card-title">🕐 Recent Exports</div>
          ${[['MIS Dec 2024','PDF','3.2 MB','04 Jan 2025','admin@skills.gov.in'],['Candidate Registry','CSV','8.4 MB','03 Jan 2025','mis@skills.gov.in'],['Placement Report Q3','Excel','2.1 MB','02 Jan 2025','admin@skills.gov.in'],['Financial Summary','PDF','1.8 MB','01 Jan 2025','fin@skills.gov.in'],['Trainer Registry','CSV','0.9 MB','31 Dec 2024','admin@skills.gov.in'],['Audit Trail Dec','CSV','4.2 MB','30 Dec 2024','admin@skills.gov.in']].map(([n,t,sz,d,u])=>`
            <div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid #F1F5F9">
              <div style="font-size:18px">${t==='PDF'?'📄':t==='CSV'?'📊':'📋'}</div>
              <div style="flex:1">
                <div style="font-size:12px;font-weight:600;color:#1A2B4A">${n}</div>
                <div style="font-size:10px;color:#6B7FA3">${t} · ${sz} · ${d} · ${u}</div>
              </div>
              <button class="action-btn btn-outline" style="font-size:10px;padding:4px 9px">↓</button>
            </div>`).join('')}
        </div>
      </div>`,

    'custom-rpt': `
      <div class="page-header"><h1>Custom Report Builder</h1><p>Build, save and schedule custom reports with your own filters and columns</p></div>
      <div class="grid2">
        <div class="card">
          <div class="card-title">🛠️ Build a Report</div>
          <div style="padding:4px 0">
            <label style="font-size:11px;font-weight:700;color:#3D5170;display:block;margin-bottom:5px">Report Name</label>
            <input type="text" placeholder="e.g. Q3 Placement Summary" style="width:100%;margin-bottom:10px">
            <label style="font-size:11px;font-weight:700;color:#3D5170;display:block;margin-bottom:5px">Data Source</label>
            <select style="width:100%;margin-bottom:10px"><option>Candidates</option><option>Placements</option><option>Training Partners</option><option>Financials</option><option>Certificates</option></select>
            <label style="font-size:11px;font-weight:700;color:#3D5170;display:block;margin-bottom:5px">Filters</label>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">
              <select><option>All Schemes</option><option>PMKVY 4.0</option><option>DDU-GKY</option></select>
              <select><option>All States</option><option>Telangana</option><option>UP</option></select>
              <input type="date" placeholder="From Date">
              <input type="date" placeholder="To Date">
            </div>
            <label style="font-size:11px;font-weight:700;color:#3D5170;display:block;margin-bottom:5px">Output Format</label>
            <select style="width:100%;margin-bottom:12px"><option>Excel (.xlsx)</option><option>CSV</option><option>PDF</option></select>
            <div style="display:flex;gap:8px">
              <button class="action-btn btn-primary" style="flex:1;justify-content:center">▶ Generate Report</button>
              <button class="action-btn btn-outline" style="flex:1;justify-content:center">💾 Save Template</button>
            </div>
          </div>
        </div>
        <div class="card">
          <div class="card-title">📂 Saved Report Templates</div>
          ${[['Q3 Placement Summary','Placements · Telangana · Q3','Excel','Weekly'],['PMKVY Monthly MIS','Candidates · PMKVY 4.0','PDF','Monthly'],['Trainer Performance','Trainers · All States','Excel','Monthly'],['Financial Overview','Financials · All Schemes','PDF','Quarterly'],['Dropout Analysis','Candidates · DDU-GKY','CSV','Weekly'],['Certificate Audit','Certificates · All','CSV','On Demand']].map(([n,f,fmt,sch])=>`
            <div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid #F1F5F9">
              <div style="flex:1">
                <div style="font-size:12px;font-weight:600;color:#1A2B4A">${n}</div>
                <div style="font-size:10px;color:#6B7FA3">${f} · ${fmt} · ${sch}</div>
              </div>
              <button class="action-btn btn-teal" style="font-size:10px;padding:4px 9px">▶ Run</button>
              <button class="action-btn btn-outline" style="font-size:10px;padding:4px 9px">✎ Edit</button>
            </div>`).join('')}
        </div>
      </div>`,

    'geo-states': `
      <div class="page-header"><h1>States & Districts</h1><p>Geographic coverage — states, districts and training footprint</p></div>
      <div class="kpi-grid">
        <div class="kpi" style="--c:#1A56C4"><div class="val">28</div><div class="lbl">States Covered</div></div>
        <div class="kpi" style="--c:#007B5E"><div class="val">312</div><div class="lbl">Districts Active</div></div>
        <div class="kpi" style="--c:#F4A900"><div class="val">124</div><div class="lbl">Uncovered Districts</div></div>
        <div class="kpi" style="--c:#7C3AED"><div class="val">6,840</div><div class="lbl">Training Centers</div></div>
      </div>
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <div class="card-title" style="margin:0">State Coverage Overview</div>
          <div style="display:flex;gap:8px">
            <input type="text" placeholder="Search state...">
            <button class="action-btn btn-teal">📤 Export</button>
          </div>
        </div>
        <table><thead><tr><th>State</th><th>Districts</th><th>Covered</th><th>Centers</th><th>Partners</th><th>Trainees</th><th>Coverage</th></tr></thead>
        <tbody>${[['Uttar Pradesh',75,62,820,380,28400,'83%'],['Maharashtra',36,32,640,320,22800,'89%'],['Rajasthan',33,28,520,220,14200,'85%'],['Bihar',38,28,280,240,9800,'74%'],['Telangana',33,31,480,180,12800,'94%'],['Karnataka',30,28,420,200,12400,'93%'],['Gujarat',33,30,380,160,10200,'91%'],['Madhya Pradesh',52,38,240,180,8600,'73%']].map(([st,d,cv,c,p,tr,cov])=>`
          <tr>
            <td style="font-weight:600;color:#003366">${st}</td>
            <td style="text-align:center">${d}</td>
            <td style="text-align:center;font-weight:700;color:#007B5E">${cv}</td>
            <td style="text-align:center">${c}</td>
            <td style="text-align:center">${p}</td>
            <td style="text-align:center">${Number(tr).toLocaleString()}</td>
            <td><span class="pill ${parseInt(cov)>=85?'green':parseInt(cov)>=75?'amber':'red'}">${cov}</span></td>
          </tr>`).join('')}
        </tbody></table>
      </div>`,

    'geo-aspire': `
      <div class="page-header"><h1>Aspirational Districts</h1><p>NITI Aayog aspirational districts — focused skilling intervention tracking</p></div>
      <div class="kpi-grid">
        <div class="kpi" style="--c:#DC2626"><div class="val">112</div><div class="lbl">Aspirational Districts</div></div>
        <div class="kpi" style="--c:#007B5E"><div class="val">84</div><div class="lbl">Covered</div></div>
        <div class="kpi" style="--c:#F4A900"><div class="val">28</div><div class="lbl">Needs Intervention</div></div>
        <div class="kpi" style="--c:#1A56C4"><div class="val">18,420</div><div class="lbl">Beneficiaries</div></div>
      </div>
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <div class="card-title" style="margin:0">Aspirational District Coverage</div>
          <div style="display:flex;gap:8px">
            <select><option>All States</option><option>UP</option><option>Bihar</option><option>Odisha</option><option>Jharkhand</option></select>
            <button class="action-btn btn-teal">📤 Export</button>
          </div>
        </div>
        <table><thead><tr><th>District</th><th>State</th><th>Centers</th><th>Partners</th><th>Trainees</th><th>Placed</th><th>Coverage</th></tr></thead>
        <tbody>${[['Shrawasti','UP',2,3,180,92,'Low'],['Bahraich','UP',3,4,240,128,'Medium'],['Gajapati','Odisha',1,2,80,38,'Low'],['Malkangiri','Odisha',2,3,140,72,'Medium'],['Chitrakoot','UP',1,2,60,28,'Low'],['Noney','Manipur',1,1,40,18,'Low'],['Khagaria','Bihar',2,3,120,58,'Medium'],['Purnea','Bihar',3,4,180,92,'Medium']].map(([d,st,c,p,tr,pl,cov])=>`
          <tr>
            <td style="font-weight:600;color:#003366">${d}</td>
            <td>${st}</td>
            <td style="text-align:center">${c}</td>
            <td style="text-align:center">${p}</td>
            <td style="text-align:center;font-weight:700">${tr}</td>
            <td style="text-align:center;font-weight:700;color:#007B5E">${pl}</td>
            <td><span class="pill ${cov==='Low'?'red':'amber'}">${cov}</span></td>
          </tr>`).join('')}
        </tbody></table>
      </div>`,

    'geo-block': `
      <div class="page-header"><h1>Block-level Mapping</h1><p>Training center presence at block and taluka level across India</p></div>
      <div class="kpi-grid">
        <div class="kpi" style="--c:#1A56C4"><div class="val">6,640</div><div class="lbl">Total Blocks</div></div>
        <div class="kpi" style="--c:#007B5E"><div class="val">3,820</div><div class="lbl">Blocks with Centers</div></div>
        <div class="kpi" style="--c:#DC2626"><div class="val">2,820</div><div class="lbl">Uncovered Blocks</div></div>
        <div class="kpi" style="--c:#F4A900"><div class="val">57%</div><div class="lbl">Block Coverage</div></div>
      </div>
      <div class="grid2">
        <div class="card">
          <div class="card-title">📌 Block Coverage by State</div>
          ${[['Telangana','94%','#007B5E',94],['Karnataka','91%','#1A56C4',91],['Gujarat','88%','#7C3AED',88],['Maharashtra','84%','#F4A900',84],['Rajasthan','72%','#DC2626',72],['Uttar Pradesh','68%','#0891B2',68],['Bihar','54%','#003366',54],['Jharkhand','48%','#DC2626',48]].map(([s,v,c,p])=>`
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:9px">
              <div style="width:110px;font-size:11.5px;color:#3D5170;flex-shrink:0">${s}</div>
              <div style="flex:1"><div class="prog-bar"><div class="prog-fill" style="width:${p}%;background:${c}"></div></div></div>
              <div style="font-size:12px;font-weight:700;color:${c};width:36px;text-align:right">${v}</div>
            </div>`).join('')}
        </div>
        <div class="card">
          <div class="card-title">🗺️ Uncovered Blocks — Priority List</div>
          <table><thead><tr><th>Block</th><th>District</th><th>State</th><th>Population</th><th>Priority</th></tr></thead>
          <tbody>${[['Shrawasti Block','Shrawasti','UP','1.2 L','High'],['Gajapati Block','Gajapati','Odisha','0.8 L','High'],['Noney Block','Noney','Manipur','0.4 L','High'],['Malkangiri Block','Malkangiri','Odisha','0.9 L','Medium'],['Khagaria Block','Khagaria','Bihar','1.1 L','High'],['Chitrakoot Block','Chitrakoot','UP','0.6 L','Medium']].map(([b,d,st,pop,p])=>`
            <tr>
              <td style="font-weight:600;font-size:11.5px">${b}</td>
              <td style="font-size:11px">${d}</td>
              <td>${st}</td>
              <td style="font-size:11px">${pop}</td>
              <td><span class="pill ${p==='High'?'red':'amber'}">${p}</span></td>
            </tr>`).join('')}
          </tbody></table>
        </div>
      </div>`,

    'geo-rural': `
      <div class="page-header"><h1>Rural / Urban Coverage</h1><p>Training reach split between rural and urban areas across schemes</p></div>
      <div class="kpi-grid">
        <div class="kpi" style="--c:#007B5E"><div class="val">68%</div><div class="lbl">Rural Trainees</div></div>
        <div class="kpi" style="--c:#1A56C4"><div class="val">32%</div><div class="lbl">Urban Trainees</div></div>
        <div class="kpi" style="--c:#7C3AED"><div class="val">84,878</div><div class="lbl">Rural Beneficiaries</div></div>
        <div class="kpi" style="--c:#F4A900"><div class="val">39,942</div><div class="lbl">Urban Beneficiaries</div></div>
      </div>
      <div class="grid2">
        <div class="card">
          <div class="card-title">🌾 Rural vs Urban by Scheme</div>
          <table><thead><tr><th>Scheme</th><th>Rural</th><th>Urban</th><th>Rural %</th></tr></thead>
          <tbody>${[['PMKVY 4.0',31200,17040,'65%'],['DDU-GKY',19962,2218,'90%'],['NAPS',11340,7560,'60%'],['State Skill Mission',14910,6390,'70%'],['CSR Programs',4920,3280,'60%'],['Fee-Based',2400,3600,'40%']].map(([sc,r,u,rp])=>`
            <tr>
              <td style="font-weight:600">${sc}</td>
              <td style="text-align:center;font-weight:700;color:#007B5E">${Number(r).toLocaleString()}</td>
              <td style="text-align:center;font-weight:700;color:#1A56C4">${Number(u).toLocaleString()}</td>
              <td style="font-weight:700;color:${parseInt(rp)>=70?'#007B5E':'#F4A900'}">${rp}</td>
            </tr>`).join('')}
          </tbody></table>
        </div>
        <div class="card">
          <div class="card-title">📊 Rural Coverage Metrics</div>
          ${[['Rural Placement Rate','62%','#007B5E',62],['Urban Placement Rate','74%','#1A56C4',74],['Rural Certification Rate','80%','#7C3AED',80],['Urban Certification Rate','86%','#F4A900',86],['Rural Female Enrolment','58%','#DC2626',58],['Urban Female Enrolment','44%','#0891B2',44]].map(([l,v,c,p])=>`
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:9px">
              <div style="width:160px;font-size:11.5px;color:#3D5170;flex-shrink:0">${l}</div>
              <div style="flex:1"><div class="prog-bar"><div class="prog-fill" style="width:${p}%;background:${c}"></div></div></div>
              <div style="font-size:12px;font-weight:700;color:${c};width:36px;text-align:right">${v}</div>
            </div>`).join('')}
        </div>
      </div>`,

    announce: `
      <div class="page-header"><h1>Announcements</h1><p>Publish platform-wide announcements to all user roles</p></div>
      <div class="grid2">
        <div class="card">
          <div class="card-title">📢 New Announcement</div>
          <div style="padding:4px 0">
            <label style="font-size:11px;font-weight:700;color:#3D5170;display:block;margin-bottom:5px">Title</label>
            <input type="text" placeholder="Announcement title..." style="width:100%;margin-bottom:10px">
            <label style="font-size:11px;font-weight:700;color:#3D5170;display:block;margin-bottom:5px">Message</label>
            <textarea placeholder="Write your announcement here..." style="width:100%;height:90px;padding:8px 10px;border:1px solid #E0E6EF;border-radius:6px;font-size:12px;font-family:inherit;resize:vertical;margin-bottom:10px"></textarea>
            <label style="font-size:11px;font-weight:700;color:#3D5170;display:block;margin-bottom:5px">Target Audience</label>
            <select style="width:100%;margin-bottom:10px"><option>All Users</option><option>Training Partners</option><option>Candidates</option><option>Trainers</option><option>Employers</option></select>
            <label style="font-size:11px;font-weight:700;color:#3D5170;display:block;margin-bottom:5px">Priority</label>
            <select style="width:100%;margin-bottom:12px"><option>Normal</option><option>High</option><option>Urgent</option></select>
            <button class="action-btn btn-primary" style="width:100%;justify-content:center">📢 Publish Announcement</button>
          </div>
        </div>
        <div class="card">
          <div class="card-title">📋 Recent Announcements</div>
          ${[['PMKVY Q1 2025 Targets Released','All Users','High','04 Jan 2025','Active'],['New Assessment Agency Empanelled','Training Partners','Normal','02 Jan 2025','Active'],['Platform Maintenance — 5 Jan 2:00 AM','All Users','Urgent','01 Jan 2025','Active'],['DDU-GKY Revised Guidelines','Training Partners','High','28 Dec 2024','Active'],['Certificate Download Feature Live','Candidates','Normal','24 Dec 2024','Expired'],['NSQF Level 5 Courses Added','All Users','Normal','20 Dec 2024','Expired']].map(([t,aud,pri,d,s])=>`
            <div style="padding:10px 0;border-bottom:1px solid #F1F5F9">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:3px">
                <span style="font-size:12px;font-weight:700;color:#1A2B4A;flex:1">${t}</span>
                <span class="pill ${pri==='Urgent'?'red':pri==='High'?'amber':'blue'}" style="font-size:9px">${pri}</span>
              </div>
              <div style="font-size:10.5px;color:#6B7FA3">${aud} · ${d} · <span style="color:${s==='Active'?'#007B5E':'#94A3B8'};font-weight:600">${s}</span></div>
            </div>`).join('')}
        </div>
      </div>`,

    'push-notif': `
      <div class="page-header"><h1>Push Notifications</h1><p>Send targeted push notifications to users on web and mobile</p></div>
      <div class="kpi-grid">
        <div class="kpi" style="--c:#1A56C4"><div class="val">48,420</div><div class="lbl">Subscribed Users</div></div>
        <div class="kpi" style="--c:#007B5E"><div class="val">284</div><div class="lbl">Sent This Month</div></div>
        <div class="kpi" style="--c:#7C3AED"><div class="val">72%</div><div class="lbl">Avg Open Rate</div></div>
        <div class="kpi" style="--c:#F4A900"><div class="val">38%</div><div class="lbl">Avg Click Rate</div></div>
      </div>
      <div class="grid2">
        <div class="card">
          <div class="card-title">🔔 Send Push Notification</div>
          <div style="padding:4px 0">
            <label style="font-size:11px;font-weight:700;color:#3D5170;display:block;margin-bottom:5px">Title</label>
            <input type="text" placeholder="Notification title..." style="width:100%;margin-bottom:10px">
            <label style="font-size:11px;font-weight:700;color:#3D5170;display:block;margin-bottom:5px">Message</label>
            <textarea placeholder="Notification body..." style="width:100%;height:70px;padding:8px 10px;border:1px solid #E0E6EF;border-radius:6px;font-size:12px;font-family:inherit;resize:vertical;margin-bottom:10px"></textarea>
            <label style="font-size:11px;font-weight:700;color:#3D5170;display:block;margin-bottom:5px">Target Role</label>
            <select style="width:100%;margin-bottom:10px"><option>All Users</option><option>Candidates</option><option>Training Partners</option><option>Trainers</option><option>Employers</option></select>
            <label style="font-size:11px;font-weight:700;color:#3D5170;display:block;margin-bottom:5px">Schedule</label>
            <select style="width:100%;margin-bottom:12px"><option>Send Now</option><option>Schedule for Later</option></select>
            <button class="action-btn btn-primary" style="width:100%;justify-content:center">🔔 Send Notification</button>
          </div>
        </div>
        <div class="card">
          <div class="card-title">📊 Recent Notifications</div>
          ${[['Assessment Reminder','Candidates',12400,'74%','41%','04 Jan 2025'],['New Jobs Available','Candidates',18200,'68%','38%','03 Jan 2025'],['Claim Deadline Alert','Training Partners',2340,'82%','52%','02 Jan 2025'],['Batch Starting Soon','Trainers',8910,'76%','44%','01 Jan 2025'],['MIS Report Ready','Admins',184,'91%','68%','31 Dec 2024']].map(([t,aud,sent,op,cl,d])=>`
            <div style="padding:9px 0;border-bottom:1px solid #F1F5F9">
              <div style="font-size:12px;font-weight:700;color:#1A2B4A;margin-bottom:3px">${t}</div>
              <div style="display:flex;gap:12px;font-size:10.5px;color:#6B7FA3">
                <span>👥 ${aud}</span>
                <span>📤 ${Number(sent).toLocaleString()}</span>
                <span>👁 ${op}</span>
                <span>🖱 ${cl}</span>
                <span>${d}</span>
              </div>
            </div>`).join('')}
        </div>
      </div>`,

    'email-tpl': `
      <div class="page-header"><h1>Email Templates</h1><p>Manage system email templates for automated communications</p></div>
      <div class="kpi-grid">
        <div class="kpi" style="--c:#1A56C4"><div class="val">42</div><div class="lbl">Total Templates</div></div>
        <div class="kpi" style="--c:#007B5E"><div class="val">38</div><div class="lbl">Active</div></div>
        <div class="kpi" style="--c:#7C3AED"><div class="val">12,840</div><div class="lbl">Emails Sent Today</div></div>
        <div class="kpi" style="--c:#F4A900"><div class="val">96%</div><div class="lbl">Delivery Rate</div></div>
      </div>
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <div class="card-title" style="margin:0">Email Templates</div>
          <div style="display:flex;gap:8px">
            <input type="text" placeholder="Search template...">
            <button class="action-btn btn-primary">+ New Template</button>
          </div>
        </div>
        ${[['Welcome Email — Candidate','Sent on registration','Candidate','Auto','Active'],['Welcome Email — Training Partner','Sent on TP registration','Training Partner','Auto','Active'],['Batch Start Reminder','Sent 2 days before batch','Candidate','Auto','Active'],['Assessment Reminder','Sent 3 days before assessment','Candidate','Auto','Active'],['Certificate Ready','Sent when certificate issued','Candidate','Auto','Active'],['Disbursement Notification','Sent when payment processed','Training Partner','Auto','Active'],['Claim Approval','Sent on claim approval','Training Partner','Auto','Active'],['Password Reset','Sent on password reset request','All Users','Auto','Active'],['MIS Report Ready','Sent when MIS generated','Admin / Govt','Auto','Active'],['Scheme Target Alert','Sent when target below 70%','Admin','Triggered','Active']].map(([n,d,aud,type,s])=>`
          <div style="display:flex;align-items:center;gap:12px;padding:9px 0;border-bottom:1px solid #F1F5F9">
            <div style="font-size:18px">✉️</div>
            <div style="flex:1">
              <div style="font-size:12px;font-weight:700;color:#1A2B4A">${n}</div>
              <div style="font-size:10.5px;color:#6B7FA3">${d} · ${aud} · <span class="pill ${type==='Auto'?'green':'blue'}" style="font-size:9px">${type}</span></div>
            </div>
            <span class="pill green" style="font-size:9px">${s}</span>
            <button class="action-btn btn-outline" style="font-size:10px;padding:4px 9px">✎ Edit</button>
          </div>`).join('')}
      </div>`,

    faq: `
      <div class="page-header"><h1>FAQs & Help Centre</h1><p>Manage frequently asked questions and help content for all users</p></div>
      <div class="kpi-grid">
        <div class="kpi" style="--c:#1A56C4"><div class="val">184</div><div class="lbl">Total FAQs</div></div>
        <div class="kpi" style="--c:#007B5E"><div class="val">6</div><div class="lbl">Categories</div></div>
        <div class="kpi" style="--c:#7C3AED"><div class="val">4,820</div><div class="lbl">Help Views This Month</div></div>
        <div class="kpi" style="--c:#F4A900"><div class="val">12</div><div class="lbl">Open Support Tickets</div></div>
      </div>
      <div class="grid2">
        <div class="card">
          <div class="card-title">❓ FAQ Categories</div>
          ${[['Registration & Login',42,'Candidates, TPs, Employers','#1A56C4'],['Course & Enrolment',38,'Candidates, Trainers','#007B5E'],['Assessment & Certification',32,'Candidates, TPs','#7C3AED'],['Financial & Disbursements',28,'Training Partners','#F4A900'],['Placement & Jobs',24,'Candidates, Employers','#DC2626'],['Technical Support',20,'All Users','#0891B2']].map(([cat,count,aud,c])=>`
            <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid #F1F5F9">
              <div style="width:32px;height:32px;border-radius:8px;background:${c}20;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0">❓</div>
              <div style="flex:1">
                <div style="font-size:12px;font-weight:700;color:#1A2B4A">${cat}</div>
                <div style="font-size:10.5px;color:#6B7FA3">${aud}</div>
              </div>
              <span style="font-size:13px;font-weight:800;color:${c}">${count}</span>
              <button class="action-btn btn-outline" style="font-size:10px;padding:4px 9px">View</button>
            </div>`).join('')}
        </div>
        <div class="card">
          <div class="card-title">🎫 Open Support Tickets</div>
          <table><thead><tr><th>Ticket</th><th>User</th><th>Issue</th><th>Priority</th><th>Status</th></tr></thead>
          <tbody>${[['TKT-001','WiiFlex Pvt Ltd','Disbursement not received','High','Open'],['TKT-002','Priya Sharma','Certificate not generated','Medium','In Progress'],['TKT-003','TechLearn Academy','Login issue','Low','Open'],['TKT-004','Ramesh Gupta','Batch not showing','Medium','In Progress'],['TKT-005','Infosys HR','Job posting error','High','Open']].map(([id,u,iss,p,s])=>`
            <tr>
              <td style="font-size:10.5px;color:#6B7FA3">${id}</td>
              <td style="font-weight:600;font-size:11.5px">${u}</td>
              <td style="font-size:11px">${iss}</td>
              <td><span class="pill ${p==='High'?'red':p==='Medium'?'amber':'blue'}">${p}</span></td>
              <td><span class="pill ${s==='In Progress'?'blue':'amber'}">${s}</span></td>
            </tr>`).join('')}
          </tbody></table>
        </div>
      </div>`,

    'doc-lib': `
      <div class="page-header"><h1>Document Library</h1><p>Centralized repository of scheme guidelines, circulars and policy documents</p></div>
      <div class="kpi-grid">
        <div class="kpi" style="--c:#1A56C4"><div class="val">284</div><div class="lbl">Total Documents</div></div>
        <div class="kpi" style="--c:#007B5E"><div class="val">48</div><div class="lbl">Added This Month</div></div>
        <div class="kpi" style="--c:#7C3AED"><div class="val">12,840</div><div class="lbl">Downloads</div></div>
        <div class="kpi" style="--c:#F4A900"><div class="val">6</div><div class="lbl">Categories</div></div>
      </div>
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <div class="card-title" style="margin:0">Document Library</div>
          <div style="display:flex;gap:8px">
            <input type="text" placeholder="Search document...">
            <select><option>All Categories</option><option>Scheme Guidelines</option><option>Circulars</option><option>Policy</option><option>Training Material</option></select>
            <button class="action-btn btn-primary">+ Upload Doc</button>
          </div>
        </div>
        ${[['PMKVY 4.0 Operational Guidelines','Scheme Guidelines','PDF','4.2 MB','Ministry of Skill Development','Dec 2024',8420],['DDU-GKY Implementation Manual','Scheme Guidelines','PDF','6.8 MB','MoRD','Nov 2024',4210],['NSQF Framework v3.0','Policy Document','PDF','2.4 MB','NCVET','Oct 2024',6840],['Assessment SOP 2024-25','Training Material','PDF','1.8 MB','NSDC','Dec 2024',3240],['Financial Management Circular 42','Circulars','PDF','0.8 MB','Finance Ministry','Dec 2024',2180],['Trainer Certification Standards','Training Material','PDF','3.2 MB','NSDC','Nov 2024',4820],['Aadhaar Seeding Guidelines','Policy Document','PDF','1.2 MB','UIDAI','Oct 2024',1840],['State Skill Mission MoU Template','Templates','DOCX','0.4 MB','MSDE','Sep 2024',920]].map(([n,cat,t,sz,by,d,dl])=>`
          <div style="display:flex;align-items:center;gap:12px;padding:9px 0;border-bottom:1px solid #F1F5F9">
            <div style="font-size:20px">${t==='PDF'?'📄':'📝'}</div>
            <div style="flex:1">
              <div style="font-size:12px;font-weight:700;color:#1A2B4A">${n}</div>
              <div style="font-size:10px;color:#6B7FA3">${cat} · ${sz} · ${by} · ${d}</div>
            </div>
            <span style="font-size:10.5px;color:#6B7FA3;margin-right:8px">↓ ${Number(dl).toLocaleString()}</span>
            <button class="action-btn btn-outline" style="font-size:10px;padding:4px 9px">📥 Download</button>
          </div>`).join('')}
      </div>`,

    'setup-sectors': `
      <div class="page-header"><h1>Sectors & Categories</h1><p>Configure industry sectors, sub-sectors and skill categories</p></div>
      <div class="kpi-grid">
        <div class="kpi" style="--c:#1A56C4"><div class="val">24</div><div class="lbl">Sectors</div></div>
        <div class="kpi" style="--c:#007B5E"><div class="val">86</div><div class="lbl">Sub-sectors</div></div>
        <div class="kpi" style="--c:#7C3AED"><div class="val">37</div><div class="lbl">Skill Councils</div></div>
        <div class="kpi" style="--c:#F4A900"><div class="val">3</div><div class="lbl">Pending Approval</div></div>
      </div>
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <div class="card-title" style="margin:0">Sector Configuration</div>
          <div style="display:flex;gap:8px">
            <input type="text" placeholder="Search sector...">
            <button class="action-btn btn-primary">+ Add Sector</button>
          </div>
        </div>
        <table><thead><tr><th>Sector</th><th>SSC</th><th>Sub-sectors</th><th>Job Roles</th><th>Courses</th><th>Status</th><th>Action</th></tr></thead>
        <tbody>${[['IT / ITeS','IT-ITeS SSC',12,480,320,'Active'],['Healthcare & Life Sciences','HSSC',8,380,240,'Active'],['Construction','CSSC',10,420,280,'Active'],['Logistics & Supply Chain','LSC',6,240,160,'Active'],['Retail','RASCI',7,320,200,'Active'],['Beauty & Wellness','B&WSSC',5,180,120,'Active'],['Agriculture','AgSSC',9,280,180,'Active'],['Automotive','ASDC',6,160,100,'Active'],['Textile & Apparel','TASC',7,200,130,'Active'],['Electronics','ESSCI',5,140,90,'Active']].map(([sec,ssc,sub,jr,c,s])=>`
          <tr>
            <td style="font-weight:600;color:#003366">${sec}</td>
            <td style="font-size:10.5px;color:#6B7FA3">${ssc}</td>
            <td style="text-align:center">${sub}</td>
            <td style="text-align:center;font-weight:700">${jr}</td>
            <td style="text-align:center;color:#1A56C4;font-weight:700">${c}</td>
            <td><span class="pill green">${s}</span></td>
            <td><button class="action-btn btn-outline" style="font-size:10px;padding:4px 9px">✎ Edit</button></td>
          </tr>`).join('')}
        </tbody></table>
      </div>`,

    'setup-jobroles': `
      <div class="page-header"><h1>Job Roles (NSQF)</h1><p>Manage NSQF-aligned job roles and qualification packs</p></div>
      <div class="kpi-grid">
        <div class="kpi" style="--c:#1A56C4"><div class="val">14,200</div><div class="lbl">Total Job Roles</div></div>
        <div class="kpi" style="--c:#007B5E"><div class="val">12,840</div><div class="lbl">NSQF Mapped</div></div>
        <div class="kpi" style="--c:#7C3AED"><div class="val">8,420</div><div class="lbl">QP Published</div></div>
        <div class="kpi" style="--c:#F4A900"><div class="val">284</div><div class="lbl">Under Review</div></div>
      </div>
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <div class="card-title" style="margin:0">Job Role Registry</div>
          <div style="display:flex;gap:8px">
            <input type="text" placeholder="Search job role...">
            <select><option>All Sectors</option><option>IT/ITeS</option><option>Healthcare</option><option>Construction</option></select>
            <select><option>All NSQF Levels</option><option>Level 2</option><option>Level 3</option><option>Level 4</option><option>Level 5</option></select>
            <button class="action-btn btn-primary">+ Add Job Role</button>
          </div>
        </div>
        <table><thead><tr><th>Job Role</th><th>Sector</th><th>NSQF Level</th><th>QP Code</th><th>Courses</th><th>Trainees</th><th>Status</th></tr></thead>
        <tbody>${[['Junior Software Developer','IT / ITeS','L4','SSC/Q0503',42,18240,'Active'],['Healthcare Assistant','Healthcare','L3','HSS/Q5102',28,12400,'Active'],['Electrical Technician','Construction','L3','CON/Q0602',36,9800,'Active'],['Data Entry Operator','IT / ITeS','L2','SSC/Q2212',64,22400,'Active'],['Beauty Therapist','Beauty & Wellness','L3','BWS/Q0101',18,6200,'Active'],['Logistics Executive','Logistics','L3','LSC/Q3001',24,8400,'Active'],['Welder','Construction','L3','CON/Q0301',30,7800,'Active'],['Field Sales Executive','Retail','L3','RAS/Q0104',38,9200,'Active']].map(([jr,sec,nsqf,qp,c,tr,s])=>`
          <tr>
            <td style="font-weight:600;color:#003366">${jr}</td>
            <td>${sec}</td>
            <td><span class="pill blue">${nsqf}</span></td>
            <td style="font-size:10.5px;color:#6B7FA3">${qp}</td>
            <td style="text-align:center">${c}</td>
            <td style="text-align:center;font-weight:700">${Number(tr).toLocaleString()}</td>
            <td><span class="pill green">${s}</span></td>
          </tr>`).join('')}
        </tbody></table>
      </div>`,

    'setup-accred': `
      <div class="page-header"><h1>Accreditation Types</h1><p>Configure accreditation types, validity periods and requirements</p></div>
      <div class="kpi-grid">
        <div class="kpi" style="--c:#1A56C4"><div class="val">8</div><div class="lbl">Accreditation Types</div></div>
        <div class="kpi" style="--c:#007B5E"><div class="val">2,340</div><div class="lbl">Partners Accredited</div></div>
        <div class="kpi" style="--c:#F4A900"><div class="val">148</div><div class="lbl">Renewals Due</div></div>
        <div class="kpi" style="--c:#DC2626"><div class="val">24</div><div class="lbl">Expired</div></div>
      </div>
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <div class="card-title" style="margin:0">Accreditation Types</div>
          <button class="action-btn btn-primary">+ Add Type</button>
        </div>
        <table><thead><tr><th>Type</th><th>Issuing Body</th><th>Validity</th><th>Requirements</th><th>Partners</th><th>Status</th><th>Action</th></tr></thead>
        <tbody>${[['ISO 9001:2015','Bureau Veritas / TÜV SÜD','3 years','Quality management system audit',1840,'Active'],['NABL Accreditation','NABL','2 years','Lab competency & testing standards',420,'Active'],['NSDC Direct Empanelment','NSDC','3 years','Min 500 trainees/yr, ISO cert',280,'Active'],['State Accreditation','State Govt / SSDM','2 years','State-specific criteria',180,'Active'],['ISO 21001:2018','Bureau Veritas','3 years','Educational org mgmt system',124,'Active'],['NCVET Recognition','NCVET','5 years','Awarding body standards compliance',86,'Active'],['SSC Empanelment','Sector Skill Council','2 years','Sector-specific criteria',320,'Active'],['MoU with NSDC','NSDC','1 year','Programme-specific agreement',640,'Active']].map(([t,ib,v,req,p,s])=>`
          <tr>
            <td style="font-weight:600;color:#003366">${t}</td>
            <td style="font-size:11px">${ib}</td>
            <td style="font-size:11px">${v}</td>
            <td style="font-size:10.5px;color:#6B7FA3;max-width:200px">${req}</td>
            <td style="text-align:center;font-weight:700;color:#1A56C4">${p}</td>
            <td><span class="pill green">${s}</span></td>
            <td><button class="action-btn btn-outline" style="font-size:10px;padding:4px 9px">✎ Edit</button></td>
          </tr>`).join('')}
        </tbody></table>
      </div>`,

    'setup-orgclass': `
      <div class="page-header"><h1>Organisation Classifications</h1><p>Configure organisation types and legal entity classifications for training partners</p></div>
      <div class="kpi-grid">
        <div class="kpi" style="--c:#1A56C4"><div class="val">12</div><div class="lbl">Classification Types</div></div>
        <div class="kpi" style="--c:#007B5E"><div class="val">2,340</div><div class="lbl">Partners Classified</div></div>
        <div class="kpi" style="--c:#7C3AED"><div class="val">3</div><div class="lbl">Pending Approval</div></div>
        <div class="kpi" style="--c:#F4A900"><div class="val">48</div><div class="lbl">Reclassifications</div></div>
      </div>
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <div class="card-title" style="margin:0">Organisation Classifications</div>
          <button class="action-btn btn-primary">+ Add Classification</button>
        </div>
        <table><thead><tr><th>Classification</th><th>Description</th><th>MCA Registration</th><th>Partners</th><th>Schemes Eligible</th><th>Status</th><th>Action</th></tr></thead>
        <tbody>${[['Private Limited Company','Incorporated under Companies Act 2013','Yes — ROC',840,'All Schemes','Active'],['Public Limited Company','Listed or unlisted public company','Yes — ROC',120,'All Schemes','Active'],['Section 8 Company','Non-profit company under Sec 8','Yes — ROC',180,'PMKVY, DDU-GKY, CSR','Active'],['Society / Trust','Registered under Societies Act','Yes — State',420,'PMKVY, DDU-GKY','Active'],['NGO / Foundation','Not-for-profit organisation','Yes — State',280,'All Schemes','Active'],['LLP','Limited Liability Partnership','Yes — ROC',160,'PMKVY, Fee-Based','Active'],['Partnership Firm','Registered partnership','Yes — State',84,'Fee-Based only','Active'],['Government Body','Central or State Govt entity','N/A',42,'All Schemes','Active'],['PSU / Autonomous Body','Public sector undertaking','N/A',24,'All Schemes','Active']].map(([cl,d,reg,p,sch,s])=>`
          <tr>
            <td style="font-weight:600;color:#003366">${cl}</td>
            <td style="font-size:10.5px;color:#6B7FA3">${d}</td>
            <td style="font-size:11px">${reg}</td>
            <td style="text-align:center;font-weight:700;color:#1A56C4">${p}</td>
            <td style="font-size:10.5px">${sch}</td>
            <td><span class="pill green">${s}</span></td>
            <td><button class="action-btn btn-outline" style="font-size:10px;padding:4px 9px">✎ Edit</button></td>
          </tr>`).join('')}
        </tbody></table>
      </div>`,

    'setup-skills': `
      <div class="page-header"><h1>Skills Database</h1><p>Master list of skills, competencies and proficiency levels</p></div>
      <div class="kpi-grid">
        <div class="kpi" style="--c:#1A56C4"><div class="val">8,420</div><div class="lbl">Total Skills</div></div>
        <div class="kpi" style="--c:#007B5E"><div class="val">6,840</div><div class="lbl">Mapped to Job Roles</div></div>
        <div class="kpi" style="--c:#7C3AED"><div class="val">1,280</div><div class="lbl">Soft Skills</div></div>
        <div class="kpi" style="--c:#F4A900"><div class="val">300</div><div class="lbl">Emerging / Digital</div></div>
      </div>
      <div class="grid2">
        <div class="card">
          <div class="card-title">💡 Skills by Category</div>
          ${[['Technical / Hard Skills',5840,'#1A56C4',69],['Soft Skills',1280,'#007B5E',15],['Digital Literacy',800,'#7C3AED',10],['Emerging Tech (AI/ML)',300,'#F4A900',4],['Domain Specific',200,'#DC2626',2]].map(([cat,v,c,p])=>`
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:9px">
              <div style="width:160px;font-size:11.5px;color:#3D5170;flex-shrink:0">${cat}</div>
              <div style="flex:1"><div class="prog-bar"><div class="prog-fill" style="width:${p*1.2}%;background:${c}"></div></div></div>
              <div style="font-size:11px;font-weight:700;color:${c};width:50px;text-align:right">${Number(v).toLocaleString()}</div>
            </div>`).join('')}
        </div>
        <div class="card">
          <div class="card-title">🔍 Top Skills in Demand</div>
          <table><thead><tr><th>Skill</th><th>Category</th><th>Job Roles</th><th>Demand</th></tr></thead>
          <tbody>${[['Python Programming','IT / ITeS',84,'Very High'],['Customer Service','Soft Skills',240,'Very High'],['Data Analysis','IT / ITeS',62,'High'],['Electrical Wiring','Construction',48,'High'],['Patient Care','Healthcare',72,'High'],['Digital Marketing','IT / ITeS',56,'High'],['Inventory Management','Logistics',38,'Medium'],['Machine Operation','Manufacturing',44,'Medium']].map(([sk,cat,jr,d])=>`
            <tr>
              <td style="font-weight:600;font-size:11.5px">${sk}</td>
              <td style="font-size:11px">${cat}</td>
              <td style="text-align:center">${jr}</td>
              <td><span class="pill ${d==='Very High'?'red':d==='High'?'amber':'blue'}">${d}</span></td>
            </tr>`).join('')}
          </tbody></table>
        </div>
      </div>`,

    'setup-schemes': `
      <div class="page-header"><h1>Government Schemes</h1><p>Master configuration for all government skill development schemes</p></div>
      <div class="kpi-grid">
        <div class="kpi" style="--c:#1A56C4"><div class="val">6</div><div class="lbl">Active Schemes</div></div>
        <div class="kpi" style="--c:#007B5E"><div class="val">2</div><div class="lbl">Central Schemes</div></div>
        <div class="kpi" style="--c:#7C3AED"><div class="val">24</div><div class="lbl">State Schemes</div></div>
        <div class="kpi" style="--c:#F4A900"><div class="val">1</div><div class="lbl">Pending Launch</div></div>
      </div>
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <div class="card-title" style="margin:0">Scheme Configuration</div>
          <button class="action-btn btn-primary">+ Add Scheme</button>
        </div>
        <table><thead><tr><th>Scheme</th><th>Type</th><th>Ministry</th><th>Launch Year</th><th>Annual Target</th><th>Budget</th><th>Status</th><th>Action</th></tr></thead>
        <tbody>${[['PMKVY 4.0','Central','Ministry of Skill Development',2022,'60,000','₹124 Cr','Active'],['DDU-GKY','Central','Ministry of Rural Development',2014,'30,000','₹68 Cr','Active'],['NAPS','Central','Ministry of Skill Development',2016,'25,000','₹48 Cr','Active'],['State Skill Mission — Telangana','State','Govt of Telangana',2015,'8,000','₹22 Cr','Active'],['State Skill Mission — Maharashtra','State','Govt of Maharashtra',2016,'7,000','₹18 Cr','Active'],['CSR Skill Initiative','CSR','NSDC / Ministry',2020,'15,000','₹4.8 Cr','Active'],['PMKVY 5.0','Central','Ministry of Skill Development',2025,'1,00,000','₹240 Cr','Planned']].map(([sc,t,min,yr,tar,b,s])=>`
          <tr>
            <td style="font-weight:600;color:#003366">${sc}</td>
            <td><span class="pill ${t==='Central'?'blue':t==='State'?'purple':'green'}" style="font-size:9px">${t}</span></td>
            <td style="font-size:10.5px;color:#6B7FA3">${min}</td>
            <td style="text-align:center">${yr}</td>
            <td style="text-align:center;font-weight:700">${tar}</td>
            <td style="color:#007B5E;font-weight:600">${b}</td>
            <td><span class="pill ${s==='Active'?'green':s==='Planned'?'amber':'gray'}">${s}</span></td>
            <td><button class="action-btn btn-outline" style="font-size:10px;padding:4px 9px">✎ Edit</button></td>
          </tr>`).join('')}
        </tbody></table>
      </div>`,

    'sys-settings': `
      <div class="page-header"><h1>System Settings</h1><p>Platform-wide configuration, security and operational settings</p></div>
      <div class="grid2">
        <div class="card">
          <div class="card-title">⚙️ General Settings</div>
          ${[['Platform Name','SkillsNJobs'],['Support Email','support@skillsnjobs.gov.in'],['Support Phone','+91-1800-XXX-XXXX'],['Default Language','English'],['Timezone','Asia/Kolkata (IST)'],['Date Format','DD/MM/YYYY'],['Session Timeout','30 minutes'],['Max File Upload Size','20 MB']].map(([l,v])=>`
            <div class="stat-row">
              <span class="lbl">${l}</span>
              <span style="font-size:12px;font-weight:600;color:#1A2B4A">${v}</span>
            </div>`).join('')}
          <button class="action-btn btn-primary" style="margin-top:14px;width:100%;justify-content:center">💾 Save Settings</button>
        </div>
        <div class="card">
          <div class="card-title">🔐 Security Settings</div>
          ${[['Two-Factor Authentication','Enabled — All Admins'],['Password Minimum Length','8 characters'],['Password Expiry','90 days'],['Max Login Attempts','5 attempts'],['Account Lockout Duration','30 minutes'],['IP Whitelist','Enabled'],['Audit Logging','Enabled — All Events'],['Data Encryption','AES-256']].map(([l,v])=>`
            <div class="stat-row">
              <span class="lbl">${l}</span>
              <span style="font-size:12px;font-weight:600;color:${v.startsWith('Enabled')?'#007B5E':'#1A2B4A'}">${v}</span>
            </div>`).join('')}
          <button class="action-btn btn-outline" style="margin-top:14px;width:100%;justify-content:center">🔐 Update Security</button>
        </div>
      </div>
      <div class="grid2" style="margin-top:14px">
        <div class="card">
          <div class="card-title">📧 Email / SMTP Settings</div>
          ${[['SMTP Host','smtp.gov.in'],['SMTP Port','587'],['Sender Name','SkillsNJobs Platform'],['Sender Email','noreply@skillsnjobs.gov.in'],['Email Encryption','TLS'],['Status','Connected ✅']].map(([l,v])=>`
            <div class="stat-row">
              <span class="lbl">${l}</span>
              <span style="font-size:12px;font-weight:600;color:${v.includes('✅')?'#007B5E':'#1A2B4A'}">${v}</span>
            </div>`).join('')}
        </div>
        <div class="card">
          <div class="card-title">🔔 Notification Settings</div>
          ${[['Email Notifications','Enabled'],['SMS Notifications','Enabled'],['Push Notifications','Enabled'],['WhatsApp Alerts','Enabled'],['Fraud Alert Threshold','3 attempts'],['Low Attendance Alert','Below 75%'],['Scheme Target Alert','Below 70%']].map(([l,v])=>`
            <div class="stat-row">
              <span class="lbl">${l}</span>
              <span style="font-size:12px;font-weight:600;color:#007B5E">${v}</span>
            </div>`).join('')}
        </div>
      </div>`,

    'api-config': `
      <div class="page-header"><h1>API Configuration</h1><p>Manage API keys, webhooks and third-party integrations</p></div>
      <div class="kpi-grid">
        <div class="kpi" style="--c:#1A56C4"><div class="val">12</div><div class="lbl">Active Integrations</div></div>
        <div class="kpi" style="--c:#007B5E"><div class="val">4</div><div class="lbl">API Keys Issued</div></div>
        <div class="kpi" style="--c:#7C3AED"><div class="val">2.4M</div><div class="lbl">API Calls This Month</div></div>
        <div class="kpi" style="--c:#F4A900"><div class="val">99.8%</div><div class="lbl">Uptime</div></div>
      </div>
      <div class="grid2">
        <div class="card">
          <div class="card-title">🔗 Active Integrations</div>
          ${[['Aadhaar / UIDAI','Identity verification for candidates','Connected ✅'],['DigiLocker','Document verification','Connected ✅'],['NSDC Portal','Scheme data sync','Connected ✅'],['NCS (National Career Service)','Job marketplace sync','Connected ✅'],['Wheebox API','Assessment integration','Connected ✅'],['PFMS','Payment & disbursement','Connected ✅'],['SMS Gateway (TRAI)','OTP & alerts','Connected ✅'],['WhatsApp Business API','Candidate notifications','Connected ✅'],['Google Maps API','Center geo-tagging','Connected ✅'],['PayGov','Fee collection gateway','Connected ✅'],['MCA21','Company verification','Connected ✅'],['GSTN','GST number validation','Connected ✅']].map(([n,d,s])=>`
            <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #F1F5F9">
              <div style="flex:1">
                <div style="font-size:12px;font-weight:700;color:#1A2B4A">${n}</div>
                <div style="font-size:10.5px;color:#6B7FA3">${d}</div>
              </div>
              <span style="font-size:11px;font-weight:700;color:#007B5E">${s}</span>
            </div>`).join('')}
        </div>
        <div class="card">
          <div class="card-title">🔑 API Keys</div>
          ${[['Production API Key','sk-prod-••••••••••••••••3a8f','All endpoints','Active'],['MIS Export Key','sk-mis-••••••••••••••••9b2d','Reports only','Active'],['Assessment Key','sk-assess-••••••••••••6c1e','Assessment APIs','Active'],['Webhook Secret','wh-••••••••••••••••••4d7a','Webhooks','Active']].map(([n,k,scope,s])=>`
            <div style="padding:10px 0;border-bottom:1px solid #F1F5F9">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
                <span style="font-size:12px;font-weight:700;color:#1A2B4A">${n}</span>
                <span class="pill green" style="font-size:9px">${s}</span>
              </div>
              <div style="font-family:monospace;font-size:11px;color:#6B7FA3;margin-bottom:4px">${k}</div>
              <div style="font-size:10px;color:#94A3B8">Scope: ${scope}</div>
            </div>`).join('')}
          <button class="action-btn btn-primary" style="margin-top:12px;width:100%;justify-content:center">+ Generate New Key</button>
        </div>
      </div>`,

    roles: `
      <div class="page-header"><h1>Roles & Permissions</h1><p>Configure access control for all user roles across the platform</p></div>
      <div class="card">
        <div class="card-title">🔑 Role Matrix</div>
        <table>
          <thead><tr><th style="width:180px">Module</th><th>Superadmin</th><th>Admin</th><th>MIS Officer</th><th>Scheme Officer</th><th>Training Partner</th><th>Trainer</th><th>Candidate</th></tr></thead>
          <tbody>${[['Platform Dashboard','✅','✅','✅','✅','✅','✅','✅'],['User Management','✅','✅','⛔','⛔','⛔','⛔','⛔'],['Training Partners','✅','✅','👁️','👁️','✅','⛔','⛔'],['Scheme Management','✅','✅','👁️','✅','⛔','⛔','⛔'],['Certificate Issuance','✅','✅','⛔','⛔','✅','⛔','⛔'],['Financial Management','✅','✅','⛔','✅','⛔','⛔','⛔'],['MIS Reports','✅','✅','✅','✅','📊','⛔','⛔'],['Audit Logs','✅','✅','⛔','⛔','⛔','⛔','⛔'],['System Settings','✅','⛔','⛔','⛔','⛔','⛔','⛔'],['Roles & Permissions','✅','⛔','⛔','⛔','⛔','⛔','⛔']].map(([m,...p])=>`
            <tr><td style="font-weight:600;font-size:12px">${m}</td>${p.map(x=>`<td style="text-align:center;font-size:14px">${x}</td>`).join('')}</tr>`).join('')}
          </tbody>
        </table>
        <div style="margin-top:12px;display:flex;gap:14px;font-size:11px;color:#6B7FA3">
          <span>✅ Full Access</span><span>👁️ View Only</span><span>📊 Own Data</span><span>⛔ No Access</span>
        </div>
      </div>`,
  };

  return panels[id] || `
    <div class="page-header"><h1>${label}</h1><p>This section is under development.</p></div>
    <div class="card" style="text-align:center;padding:48px">
      <div style="font-size:48px;margin-bottom:14px">🚧</div>
      <div style="font-size:16px;font-weight:700;color:#003366;margin-bottom:6px">Coming Soon</div>
      <div style="font-size:12px;color:#6B7FA3">This module is being built. Please check back shortly.</div>
    </div>`;
}

export default function SuperadminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeId, setActiveId] = useState('dashboard');
  const [openGroups, setOpenGroups] = useState({});
  const [collapsed, setCollapsed] = useState(false);

  const navFlat = NAV.flatMap(g => g.items.flatMap(i => i.children ? [i, ...i.children] : [i]));

  function getLabel(id) {
    const item = navFlat.find(i => i.id === id);
    return item?.label || id;
  }

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
    if (hasChildren) {
      setOpenGroups(prev => ({ ...prev, [id]: !prev[id] }));
      return;
    }
    setActiveId(id);
    if (parentId && !openGroups[parentId]) {
      setOpenGroups(prev => ({ ...prev, [parentId]: true }));
    }
  }

  const initials = (user?.name || user?.first_name || 'SA').split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="sa-wrap">
        {/* SIDEBAR */}
        <aside className={`sa-sidebar${collapsed ? ' collapsed' : ''}`}>
          <div className="sa-logo" onClick={() => setActiveId('dashboard')}>
            <div className="mark">🎯</div>
            {!collapsed && (
              <div className="brand">
                <div className="brand-name">SkillsNJobs</div>
                <div className="brand-tag">Admin Portal</div>
              </div>
            )}
          </div>

          <nav className="sa-nav">
            {NAV.map(group => (
              <div key={group.section}>
                <div className="sa-section">{group.section}</div>
                {group.items.map(item => {
                  const isOpen = openGroups[item.id];
                  const isParentActive = item.children?.some(c => c.id === activeId);
                  return (
                    <div key={item.id}>
                      <div
                        className={`sa-item${!item.children && activeId === item.id ? ' active' : ''}${item.children && isParentActive ? ' parent-active' : ''}`}
                        onClick={() => handleItem(item.id, !!item.children)}
                      >
                        <span className="sa-icon">{item.icon || '•'}</span>
                        <span className="sa-lbl">
                          {item.label}
                          {item.tag && <span className={`sa-tag ${item.tagType}`}>{item.tag}</span>}
                        </span>
                        {item.badge && <span className="sa-badge">{item.badge}</span>}
                        {item.children && (
                          <span className="sa-chev" style={{ transform: isOpen ? 'rotate(180deg)' : 'none' }}>▾</span>
                        )}
                      </div>
                      {item.children && (
                        <div className={`sa-children${isOpen ? ' open' : ''}`}>
                          {item.children.map(child => (
                            <div
                              key={child.id}
                              className={`sa-child${activeId === child.id ? ' active' : ''}`}
                              onClick={() => handleItem(child.id, false, item.id)}
                            >
                              · {child.label}
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

          <div className="sa-footer">
            <div className="sa-avatar">{initials}</div>
            {!collapsed && (
              <div>
                <div className="sa-uname">{user?.first_name || user?.name || 'Super Admin'}</div>
                <div className="sa-urole">Superadmin</div>
              </div>
            )}
          </div>
        </aside>

        {/* MAIN */}
        <div className="sa-main">
          <div className="sa-topbar">
            <div className="sa-breadcrumb">
              <span className="sa-tb-section">{getSection(activeId)}</span>
              <span className="sa-tb-section">/</span>
              <span className="sa-tb-title">{getLabel(activeId)}</span>
            </div>
            <div className="sa-actions">
              <span className="sa-badge-notif">🔔 5 Alerts</span>
              <div className="sa-user-info">
                <div className="sa-av">{initials}</div>
                <div>
                  <div className="sa-tb-uname">{user?.first_name || user?.name || 'Super Admin'}</div>
                  <div className="sa-tb-urole">Superadmin</div>
                </div>
              </div>
              <button className="sa-signout-btn" onClick={() => { logout(); navigate('/login'); }}>
                ⏻ Sign Out
              </button>
            </div>
          </div>

          <div
            className="sa-content"
            dangerouslySetInnerHTML={{ __html: getPanelHtml(activeId, navFlat) }}
          />
        </div>
      </div>
    </>
  );
}
