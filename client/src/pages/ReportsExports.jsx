import { useState, useEffect } from 'react';
import { api } from '../api.js';

const REPORTS = [
  {
    group: 'User Reports',
    icon: '👥',
    color: '#1E5FBF',
    items: [
      { key: 'candidates',         label: 'All Candidates',        desc: 'Full candidate list with skills, location, education.',    apiRole: 'candidate' },
      { key: 'employers',          label: 'Employer Directory',     desc: 'All registered employers with org details.',               apiRole: 'employer' },
      { key: 'training_vendors',   label: 'Training Vendors',       desc: 'Training organisations and infrastructure overview.',      apiRole: 'training_vendor' },
      { key: 'trainers',           label: 'Trainers List',          desc: 'Certified trainers and their course assignments.',         apiRole: 'trainer' },
      { key: 'placement_agencies', label: 'Placement Agencies',     desc: 'All placement and staffing partners.',                    apiRole: 'placement_agency' },
      { key: 'csr_orgs',           label: 'CSR Organizations',      desc: 'Corporate social responsibility partners.',               apiRole: 'csr_org' },
    ],
  },
  {
    group: 'Jobs & Placements',
    icon: '💼',
    color: '#0891B2',
    items: [
      { key: 'jobs',               label: 'All Job Postings',       desc: 'Open and closed jobs with salary bands and skills.', apiJob: true },
      { key: 'applications',       label: 'Applications Summary',   desc: 'All applications with status and match scores.',     apiApps: true },
    ],
  },
  {
    group: 'Training & Courses',
    icon: '🎓',
    color: '#0A7B6C',
    items: [
      { key: 'courses',            label: 'Course Catalogue',       desc: 'All courses with provider, level, and rating.',     apiCourses: true },
    ],
  },
  {
    group: 'Government & Compliance',
    icon: '🏛️',
    color: '#065F46',
    items: [
      { key: 'audit_logs',         label: 'Audit Log Export',       desc: 'Login history and admin action records.',           apiAudit: true },
    ],
  },
];

function toCSV(rows, cols) {
  const header = cols.map(c => c.label).join(',');
  const lines = rows.map(r =>
    cols.map(c => {
      const v = typeof c.get === 'function' ? c.get(r) : (r[c.key] ?? '');
      const s = String(v).replace(/"/g, '""');
      return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s}"` : s;
    }).join(',')
  );
  return [header, ...lines].join('\n');
}

function downloadCSV(filename, csv) {
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

const USER_COLS = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'role', label: 'Role' },
  { key: 'org_name', label: 'Organisation' },
  { key: 'location', label: 'Location' },
  { key: 'phone', label: 'Phone' },
  { key: 'city', label: 'City' },
  { key: 'state_name', label: 'State' },
  { key: 'created_at', label: 'Joined' },
];

const CANDIDATE_COLS = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'gender', label: 'Gender' },
  { key: 'dob', label: 'DOB' },
  { key: 'city', label: 'City' },
  { key: 'state_name', label: 'State' },
  { key: 'qualification', label: 'Qualification' },
  { key: 'employment_status', label: 'Employment Status' },
  { key: 'preferred_sector', label: 'Preferred Sector' },
  { label: 'Skills', get: r => (r.skills || []).join('; ') },
  { key: 'created_at', label: 'Joined' },
];

const JOB_COLS = [
  { key: 'id', label: 'ID' },
  { key: 'title', label: 'Title' },
  { key: 'location', label: 'Location' },
  { key: 'job_type', label: 'Type' },
  { key: 'salary_min', label: 'Salary Min' },
  { key: 'salary_max', label: 'Salary Max' },
  { key: 'status', label: 'Status' },
  { label: 'Skills', get: r => (r.required_skills || []).join('; ') },
  { key: 'created_at', label: 'Posted On' },
];

const APP_COLS = [
  { key: 'id', label: 'ID' },
  { key: 'job_id', label: 'Job ID' },
  { key: 'candidate_id', label: 'Candidate ID' },
  { key: 'status', label: 'Status' },
  { key: 'match_score', label: 'Match Score' },
  { key: 'created_at', label: 'Applied On' },
];

const COURSE_COLS = [
  { key: 'id', label: 'ID' },
  { key: 'title', label: 'Title' },
  { key: 'provider', label: 'Provider' },
  { key: 'level', label: 'Level' },
  { key: 'duration_weeks', label: 'Duration (wks)' },
  { key: 'rating', label: 'Rating' },
  { label: 'Skill Tags', get: r => { try { return JSON.parse(r.skill_tags || '[]').join('; '); } catch { return ''; } } },
  { key: 'created_at', label: 'Created' },
];

const AUDIT_COLS = [
  { key: 'id', label: 'ID' },
  { key: 'user_name', label: 'User' },
  { key: 'user_role', label: 'Role' },
  { key: 'action', label: 'Action' },
  { key: 'entity', label: 'Entity' },
  { key: 'entity_id', label: 'Entity ID' },
  { key: 'detail', label: 'Detail' },
  { key: 'ip', label: 'IP' },
  { key: 'created_at', label: 'Time' },
];

export default function ReportsExports() {
  const [stats, setStats] = useState({});
  const [busy, setBusy] = useState({});
  const [done, setDone] = useState({});

  useEffect(() => {
    api.userStats().then(setStats).catch(() => {});
  }, []);

  async function exportReport(item) {
    if (busy[item.key]) return;
    setBusy(b => ({ ...b, [item.key]: true }));
    try {
      let csv = '';
      const now = new Date().toISOString().slice(0, 10);

      if (item.apiRole) {
        const role = item.apiRole === 'candidate' ? null : item.apiRole;
        const rows = role ? await api.usersByRole(role) : await api.candidates();
        const cols = item.apiRole === 'candidate' ? CANDIDATE_COLS : USER_COLS;
        csv = toCSV(rows, cols);
        downloadCSV(`${item.key}_${now}.csv`, csv);
      } else if (item.apiJob) {
        const rows = await api.jobs();
        csv = toCSV(rows, JOB_COLS);
        downloadCSV(`jobs_${now}.csv`, csv);
      } else if (item.apiApps) {
        const rows = await api.allApplications();
        csv = toCSV(rows, APP_COLS);
        downloadCSV(`applications_${now}.csv`, csv);
      } else if (item.apiCourses) {
        const rows = await api.courses();
        csv = toCSV(rows, COURSE_COLS);
        downloadCSV(`courses_${now}.csv`, csv);
      } else if (item.apiAudit) {
        const data = await api.auditLogs({ limit: 500 });
        csv = toCSV(data.rows, AUDIT_COLS);
        downloadCSV(`audit_logs_${now}.csv`, csv);
      }

      setDone(d => ({ ...d, [item.key]: true }));
      setTimeout(() => setDone(d => ({ ...d, [item.key]: false })), 3000);
    } catch (e) {
      alert('Export failed: ' + e.message);
    } finally {
      setBusy(b => ({ ...b, [item.key]: false }));
    }
  }

  return (
    <div className="page" style={{ maxWidth: 1000 }}>
      <div className="page-header">
        <h1>Reports &amp; Exports</h1>
        <p>Download platform-wide data as CSV files, filtered by category.</p>
      </div>

      {/* Summary KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 32 }}>
        {[
          { label: 'Candidates',   val: stats.candidate         ?? '—', color: '#1E5FBF' },
          { label: 'Employers',    val: stats.employer          ?? '—', color: '#0891B2' },
          { label: 'Vendors',      val: stats.training_vendor   ?? '—', color: '#0A7B6C' },
          { label: 'Trainers',     val: stats.trainer           ?? '—', color: '#7C3AED' },
          { label: 'Agencies',     val: (stats.placement_agency ?? 0) + (stats.csr_org ?? 0), color: '#C0392B' },
        ].map(k => (
          <div key={k.label} className="kpi" style={{ textAlign: 'center' }}>
            <div className="val" style={{ color: k.color, fontSize: 26 }}>{k.val}</div>
            <div className="lbl">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Report groups */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {REPORTS.map(group => (
          <div key={group.group}>
            {/* Group header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 16 }}>{group.icon}</span>
              <span style={{ fontWeight: 800, fontSize: 13, color: group.color, textTransform: 'uppercase', letterSpacing: 0.5 }}>{group.group}</span>
              <div style={{ flex: 1, height: 1, background: '#DDE3EE', marginLeft: 4 }} />
            </div>

            {/* Report cards grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {group.items.map(item => (
                <div key={item.key} className="card shadow" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#0B1E3D', marginBottom: 4 }}>{item.label}</div>
                    <div style={{ fontSize: 12, color: '#7886A6', lineHeight: 1.5 }}>{item.desc}</div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 8, borderTop: '1px solid #EEF2F8' }}>
                    <span style={{ fontSize: 11, color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ color: '#10B981' }}>●</span> CSV
                    </span>
                    <button
                      onClick={() => exportReport(item)}
                      disabled={!!busy[item.key]}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                        border: '1.5px solid',
                        borderColor: done[item.key] ? '#10B981' : group.color,
                        background: done[item.key] ? '#ECFDF5' : busy[item.key] ? '#F8FAFC' : '#fff',
                        color: done[item.key] ? '#065F46' : busy[item.key] ? '#9CA3AF' : group.color,
                        cursor: busy[item.key] ? 'not-allowed' : 'pointer',
                        transition: 'all .15s',
                      }}>
                      {done[item.key] ? '✓ Downloaded' : busy[item.key] ? 'Exporting…' : '↓ Export CSV'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
