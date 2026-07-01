import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api.js';

/* ── Animated counter ─────────────────────────────────────────── */
function Counter({ to, prefix = '', suffix = '', duration = 1200 }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!to) { setVal(0); return; }
    let start = null;
    const step = ts => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setVal(Math.floor((1 - Math.pow(1 - p, 3)) * to));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [to, duration]);
  return <>{prefix}{val.toLocaleString('en-IN')}{suffix}</>;
}

/* ── Progress bar ─────────────────────────────────────────────── */
function KPIBar({ label, pct, color, sub }) {
  const [w, setW] = useState(0);
  useEffect(() => { setTimeout(() => setW(pct), 80); }, [pct]);
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#445074' }}>{label}</span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {sub && <span style={{ fontSize: 10, color: '#9CA3AF' }}>{sub}</span>}
          <span style={{ fontSize: 12, fontWeight: 800, color }}>{pct}%</span>
        </div>
      </div>
      <div style={{ background: '#EEF2F8', borderRadius: 8, height: 7, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${w}%`, background: color, borderRadius: 8, transition: 'width 1s cubic-bezier(.4,0,.2,1)' }} />
      </div>
    </div>
  );
}

/* ── Stat card ─────────────────────────────────────────────────── */
function StatCard({ icon, val, label, color, sub, prefix = '', suffix = '' }) {
  return (
    <div className="card shadow" style={{ padding: '16px 18px', borderTop: `3px solid ${color}` }}>
      <div style={{ fontSize: 20, marginBottom: 5 }}>{icon}</div>
      <div style={{ fontWeight: 900, fontSize: 24, color, letterSpacing: -0.5, lineHeight: 1.1 }}>
        <Counter to={val} prefix={prefix} suffix={suffix} />
      </div>
      <div style={{ fontSize: 11, color: '#445074', fontWeight: 600, margin: '5px 0 4px' }}>{label}</div>
      {sub && <div style={{ fontSize: 10, color, fontWeight: 700 }}>↑ {sub}</div>}
    </div>
  );
}

/* ── Role table ────────────────────────────────────────────────── */
const SECTIONS = [
  { key: 'candidate',        label: 'Candidates',         icon: '👤', color: '#1E5FBF' },
  { key: 'training_vendor',  label: 'Training Vendors',   icon: '🏫', color: '#0A7B6C' },
  { key: 'trainer',          label: 'Trainers',           icon: '👨‍🏫', color: '#7C3AED' },
  { key: 'csr_org',          label: 'CSR Organizations',  icon: '🤝', color: '#E6A817' },
  { key: 'placement_agency', label: 'Placement Agencies', icon: '💼', color: '#C0392B' },
  { key: 'employer',         label: 'Employers',          icon: '🏢', color: '#0891B2' },
];

const SLUG_TO_KEY = {
  'candidates': 'candidate', 'training-vendors': 'training_vendor',
  'trainers': 'trainer', 'csr-organizations': 'csr_org',
  'placement-agencies': 'placement_agency', 'employers': 'employer',
};

function RoleTable({ role, label }) {
  const [rows, setRows] = useState(null);
  const [err, setErr]   = useState('');
  useEffect(() => { api.usersByRole(role).then(setRows).catch(e => setErr(e.message)); }, [role]);
  if (err)   return <div style={{ color: '#EF4444', fontSize: 13, padding: 16 }}>{err}</div>;
  if (!rows) return <div style={{ color: '#7886A6', fontSize: 13, padding: 16 }}>Loading…</div>;
  if (!rows.length) return <div style={{ color: '#7886A6', fontSize: 13, padding: 16 }}>No {label.toLowerCase()} registered yet.</div>;
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: '#0F2545' }}>
            {['Name', 'Email', 'Location', 'Org / Bio', 'Joined'].map(h => (
              <th key={h} style={{ padding: '9px 14px', color: 'rgba(255,255,255,.6)', fontSize: 11, fontWeight: 700, textAlign: 'left' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((u, i) => (
            <tr key={u.id} style={{ background: i % 2 === 0 ? '#fff' : '#FAFBFD', borderBottom: '1px solid #EFF2F8' }}>
              <td style={TD}><span style={{ fontWeight: 700, color: '#0B1E3D' }}>{u.first_name ? `${u.first_name} ${u.last_name || ''}`.trim() : u.name}</span></td>
              <td style={TD}>{u.email}</td>
              <td style={TD}>{u.location || '—'}</td>
              <td style={TD}>{u.org_name || u.bio || '—'}</td>
              <td style={TD}>{u.created_at?.slice(0, 10) || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
const TD = { padding: '9px 14px', color: '#445074', verticalAlign: 'top', fontSize: 13 };

/* ── Feed item ─────────────────────────────────────────────────── */
const ACTION_MAP = {
  'Login':            { icon: '🔑', color: '#1E5FBF', label: 'User logged in' },
  'Login failed':     { icon: '⚠️', color: '#C0392B', label: 'Failed login attempt' },
  'User registered':  { icon: '📋', color: '#0A7B6C', label: 'New registration' },
  'Profile updated':  { icon: '✏️', color: '#7C3AED', label: 'Profile updated' },
  'Bulk import':      { icon: '📥', color: '#D97706', label: 'Bulk import' },
};

function timeAgo(ts) {
  if (!ts) return '';
  const diff = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (diff < 60)   return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
  return `${Math.floor(diff / 86400)} days ago`;
}

/* ══ Main ═══════════════════════════════════════════════════════ */
export default function SuperadminDashboard() {
  const { section } = useParams();
  const navigate    = useNavigate();

  const [st, setSt]       = useState(null);   // userStats
  const [logs, setLogs]   = useState([]);      // audit logs for feed
  const [active, setActive] = useState(SLUG_TO_KEY[section] || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { setActive(SLUG_TO_KEY[section] || null); }, [section]);

  useEffect(() => {
    Promise.all([
      api.userStats(),
      api.auditLogs({ limit: 20 }),
    ]).then(([stats, auditData]) => {
      setSt(stats);
      setLogs(Array.isArray(auditData) ? auditData : (auditData?.logs || []));
      setLoading(false);
    }).catch(() => setLoading(false));

    // refresh feed every 30s
    const t = setInterval(() => {
      api.auditLogs({ limit: 20 }).then(d => setLogs(Array.isArray(d) ? d : (d?.logs || []))).catch(() => {});
    }, 30000);
    return () => clearInterval(t);
  }, []);

  if (loading) return <div style={{ padding: 40, color: '#7886A6', fontSize: 14 }}>Loading dashboard…</div>;

  /* ── Derived numbers ── */
  const S = st || {};
  const candidates      = S.candidate        || 0;
  const trainingVendors = S.training_vendor  || 0;
  const trainers        = S.trainer          || 0;
  const employers       = S.employer         || 0;
  const csrOrgs         = S.csr_org          || 0;
  const placementAgencies = S.placement_agency || 0;
  const totalUsers      = S.total_users      || 0;
  const openJobs        = S.open_jobs        || 0;
  const totalJobs       = S.total_jobs       || 0;
  const courses         = S.total_courses    || 0;
  const applications    = S.applications     || 0;
  const hired           = S.hired            || 0;
  const shortlisted     = S.shortlisted      || 0;
  const enrollments     = S.enrollments      || 0;

  const placementRate = candidates > 0 ? Math.round((hired / candidates) * 100) : 0;
  const appRate       = candidates > 0 ? Math.round((applications / candidates) * 100) : 0;
  const hireRate      = applications > 0 ? Math.round((hired / applications) * 100) : 0;
  const courseEngagement = candidates > 0 ? Math.min(Math.round((enrollments / candidates) * 100), 100) : 0;
  const jobFillRate   = totalJobs > 0 ? Math.min(Math.round((hired / totalJobs) * 100), 100) : 0;
  const shortlistRate = applications > 0 ? Math.round((shortlisted / applications) * 100) : 0;

  const KPI_CARDS = [
    { icon: '👤', val: candidates,      label: 'Registered Candidates',    color: '#1E5FBF', sub: `${applications} applications` },
    { icon: '🏫', val: trainingVendors, label: 'Training Vendors',          color: '#0A7B6C', sub: `${courses} courses available` },
    { icon: '👨‍🏫', val: trainers,        label: 'Certified Trainers',        color: '#7C3AED', sub: `${enrollments} enrolments` },
    { icon: '🎯', val: hired,           label: 'Total Placements (Hired)',   color: '#065F46', sub: `${placementRate}% placement rate` },
    { icon: '🏢', val: employers,       label: 'Employers',                  color: '#0891B2', sub: `${openJobs} open jobs` },
  ];

  const KPIS = [
    { label: 'Placement Rate',        pct: Math.min(placementRate, 100), color: '#065F46', sub: `${hired} hired of ${candidates} candidates` },
    { label: 'Application Rate',      pct: Math.min(appRate, 100),       color: '#1E5FBF', sub: `${applications} applications` },
    { label: 'Hire Rate (from apps)', pct: Math.min(hireRate, 100),      color: '#0A7B6C', sub: `${hired} hired of ${applications} applied` },
    { label: 'Shortlist Rate',        pct: Math.min(shortlistRate, 100), color: '#7C3AED', sub: `${shortlisted} shortlisted` },
    { label: 'Course Engagement',     pct: Math.min(courseEngagement, 100), color: '#D97706', sub: `${enrollments} enrolments` },
    { label: 'Job Fill Rate',         pct: Math.min(jobFillRate, 100),   color: '#0891B2', sub: `${hired} filled of ${totalJobs} jobs` },
  ];

  const MODULES = [
    { icon: '👤', label: 'Candidate Lifecycle',    flow: 'Registration → Applications → Shortlist → Placement', color: '#1E5FBF',
      stats: [{ val: candidates, label: 'registered', bg: '#EFF6FF', fg: '#1E5FBF' }, { val: hired, label: 'placed', bg: '#ECFDF5', fg: '#065F46' }], to: '/candidates' },
    { icon: '🏫', label: 'Vendor / TP Management', flow: 'Registration → Courses → Enrolments → Delivery',       color: '#0A7B6C',
      stats: [{ val: trainingVendors, label: 'vendors', bg: '#ECFDF5', fg: '#065F46' }, { val: courses, label: 'courses', bg: '#ECFDF5', fg: '#065F46' }], to: '/superadmin/training-vendors' },
    { icon: '👨‍🏫', label: 'Trainer Marketplace',    flow: 'Profile → Courses → Enrolments → Delivery',            color: '#7C3AED',
      stats: [{ val: trainers, label: 'trainers', bg: '#F5F3FF', fg: '#7C3AED' }, { val: enrollments, label: 'enrolments', bg: '#F5F3FF', fg: '#7C3AED' }], to: '/superadmin/trainers' },
    { icon: '🏢', label: 'Employer Portal',         flow: 'Register → Post Jobs → Applications → Hire',           color: '#0891B2',
      stats: [{ val: employers, label: 'employers', bg: '#ECFEFF', fg: '#0E7490' }, { val: openJobs, label: 'open jobs', bg: '#ECFEFF', fg: '#0E7490' }], to: '/superadmin/employers' },
    { icon: '📋', label: 'Jobs & Applications',     flow: 'Post → Browse → Apply → Shortlist → Hire → Confirm',  color: '#374151',
      stats: [{ val: totalJobs, label: 'total jobs', bg: '#F1F5F9', fg: '#374151' }, { val: applications, label: 'applications', bg: '#F1F5F9', fg: '#374151' }], to: '/jobs' },
    { icon: '🤝', label: 'CSR & Placement Partners',flow: 'Register → Projects → Candidate Connect → Placement',  color: '#E6A817',
      stats: [{ val: csrOrgs, label: 'CSR orgs', bg: '#FFFBEB', fg: '#92400E' }, { val: placementAgencies, label: 'agencies', bg: '#FFFBEB', fg: '#92400E' }], to: '/superadmin/csr-organizations' },
  ];

  const QUICK_ACTIONS = [
    { label: '💼  Post a Job',          to: '/my-jobs',             primary: true  },
    { label: '👤  Register Candidate',  to: '/register',            primary: false },
    { label: '🎓  Browse Courses',      to: '/courses',             primary: false },
    { label: '⚙️  Setup',              to: '/superadmin/setup',    primary: false },
  ];

  const activeSection = SECTIONS.find(s => s.key === active);

  return (
    <div className="page" style={{ maxWidth: 1200, paddingBottom: 40 }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 22 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#0B1E3D', margin: 0 }}>Platform Overview</h1>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: '#9CA3AF' }}>SkillsNJobs · {totalUsers} total users · Real-time data</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 20, padding: '5px 12px' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#10B981', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#065F46' }}>Live</span>
          </div>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginBottom: 20 }}>
        {KPI_CARDS.map(card => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      {/* ── Secondary stat row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Jobs',    val: totalJobs,    color: '#374151', icon: '📋' },
          { label: 'Open Jobs',     val: openJobs,     color: '#0891B2', icon: '💼' },
          { label: 'Applications',  val: applications, color: '#7C3AED', icon: '📄' },
          { label: 'Enrolments',    val: enrollments,  color: '#D97706', icon: '🎓' },
        ].map(s => (
          <div key={s.label} className="card shadow" style={{ padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 12, borderLeft: `4px solid ${s.color}` }}>
            <span style={{ fontSize: 22 }}>{s.icon}</span>
            <div>
              <div style={{ fontWeight: 900, fontSize: 20, color: s.color }}><Counter to={s.val} /></div>
              <div style={{ fontSize: 11, color: '#7886A6', fontWeight: 600 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Feed + KPI Tracker + Quick Actions ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, marginBottom: 20 }}>

        {/* Live feed from audit logs */}
        <div className="card shadow" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '13px 18px', borderBottom: '1px solid #EEF2F8', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>⚡</span>
            <span style={{ fontWeight: 800, fontSize: 14, color: '#0B1E3D' }}>Live Activity Feed</span>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#10B981', animation: 'pulse 2s infinite' }} />
            <span style={{ marginLeft: 'auto', fontSize: 11, color: '#9CA3AF' }}>Last {logs.length} events</span>
          </div>
          <div style={{ maxHeight: 340, overflowY: 'auto' }}>
            {logs.length === 0 && (
              <div style={{ padding: 24, color: '#9CA3AF', fontSize: 13, textAlign: 'center' }}>No activity yet.</div>
            )}
            {logs.map((log, i) => {
              const m = ACTION_MAP[log.action] || { icon: '📌', color: '#374151', label: log.action };
              return (
                <div key={log.id} style={{ display: 'flex', gap: 12, padding: '11px 18px', borderBottom: '1px solid #F4F6FA',
                  background: i === 0 ? '#F0FDF4' : '#fff' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: m.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>
                    {m.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                      <span style={{ fontWeight: 700, fontSize: 13, color: '#0B1E3D' }}>{m.label}</span>
                      <span style={{ fontSize: 10, color: '#9CA3AF', whiteSpace: 'nowrap', flexShrink: 0 }}>{timeAgo(log.created_at)}</span>
                    </div>
                    <div style={{ fontSize: 11, color: '#7886A6', marginTop: 2 }}>
                      {log.user_name}{log.user_role ? ` · ${log.user_role}` : ''}{log.detail ? ` · ${log.detail}` : ''}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card shadow" style={{ padding: '16px 18px', flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 13, color: '#0B1E3D', marginBottom: 14 }}>📊 Platform KPIs</div>
            {KPIS.map(k => <KPIBar key={k.label} {...k} />)}
          </div>
          <div className="card shadow" style={{ padding: '14px 16px' }}>
            <div style={{ fontWeight: 800, fontSize: 13, color: '#0B1E3D', marginBottom: 10 }}>⚡ Quick Actions</div>
            {QUICK_ACTIONS.map(a => (
              <button key={a.label} onClick={() => navigate(a.to)}
                style={{ width: '100%', textAlign: 'left', padding: '9px 12px', marginBottom: 6, borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all .15s',
                  background: a.primary ? '#1E5FBF' : '#F8FAFC', color: a.primary ? '#fff' : '#445074',
                  border: a.primary ? 'none' : '1.5px solid #EEF2F8' }}>
                {a.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Modules ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontWeight: 800, fontSize: 14, color: '#0B1E3D', marginBottom: 14 }}>Platform Modules</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
          {MODULES.map(m => (
            <div key={m.label} className="card shadow" onClick={() => navigate(m.to)}
              style={{ padding: '15px 18px', cursor: 'pointer', borderLeft: `4px solid ${m.color}`, transition: 'box-shadow .15s, transform .15s' }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,.12)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.transform = ''; }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                <span style={{ fontSize: 17 }}>{m.icon}</span>
                <span style={{ fontWeight: 800, fontSize: 13, color: '#0B1E3D' }}>{m.label}</span>
              </div>
              <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 10, lineHeight: 1.6 }}>{m.flow}</div>
              <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                {m.stats.map((s, i) => (
                  <span key={i} style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: s.bg, color: s.fg }}>
                    {s.val.toLocaleString('en-IN')} {s.label}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── User drill-down ── */}
      <div style={{ borderTop: '2px solid #EEF2F8', paddingTop: 24 }}>
        <div style={{ fontWeight: 800, fontSize: 14, color: '#0B1E3D', marginBottom: 14 }}>User Registry — Drill Down</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 10, marginBottom: 16 }}>
          {SECTIONS.map(s => (
            <div key={s.key} onClick={() => setActive(active === s.key ? null : s.key)}
              style={{ background: active === s.key ? s.color : '#fff', border: `1.5px solid ${active === s.key ? s.color : '#DDE3EE'}`,
                borderRadius: 10, padding: '12px 10px', cursor: 'pointer', transition: 'all .15s', textAlign: 'center',
                boxShadow: active === s.key ? '0 4px 14px rgba(0,0,0,.12)' : 'none' }}>
              <div style={{ fontSize: 20, marginBottom: 3 }}>{s.icon}</div>
              <div style={{ fontWeight: 800, fontSize: 20, color: active === s.key ? '#fff' : '#0B1E3D', lineHeight: 1 }}>
                <Counter to={S[s.key] || 0} />
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, color: active === s.key ? 'rgba(255,255,255,.75)' : '#7886A6', marginTop: 3, textTransform: 'uppercase', letterSpacing: 0.3 }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {active && activeSection && (
          <div className="card shadow" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', borderBottom: '1px solid #DDE3EE', background: activeSection.color }}>
              <span style={{ fontSize: 17 }}>{activeSection.icon}</span>
              <span style={{ fontWeight: 700, fontSize: 13, color: '#fff' }}>{activeSection.label}</span>
              <span style={{ marginLeft: 'auto', fontSize: 12, color: 'rgba(255,255,255,.75)', fontWeight: 600 }}>{(S[active] || 0)} total</span>
            </div>
            <RoleTable key={active} role={active} label={activeSection.label} />
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:.4; } }
      `}</style>
    </div>
  );
}
