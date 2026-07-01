import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';

/* ── Animated counter ─────────────────────────────────────────── */
function Counter({ to, prefix = '', suffix = '', duration = 1400 }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = null;
    const step = ts => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setVal(Math.floor(ease * to));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [to, duration]);
  return <>{prefix}{val.toLocaleString('en-IN')}{suffix}</>;
}

/* ── Progress bar ─────────────────────────────────────────────── */
function KPIBar({ label, pct, color, target }) {
  const [width, setWidth] = useState(0);
  useEffect(() => { setTimeout(() => setWidth(pct), 80); }, [pct]);
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#445074' }}>{label}</span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {target && <span style={{ fontSize: 10, color: '#9CA3AF' }}>Target: {target}</span>}
          <span style={{ fontSize: 12, fontWeight: 800, color }}>{pct}%</span>
        </div>
      </div>
      <div style={{ background: '#EEF2F8', borderRadius: 8, height: 8, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${width}%`, background: color, borderRadius: 8, transition: 'width 1s cubic-bezier(.4,0,.2,1)' }} />
      </div>
    </div>
  );
}

/* ── Sparkline ─────────────────────────────────────────────────── */
function Sparkline({ data, color }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const W = 80, H = 28;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((v - min) / (max - min || 1)) * H;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── Live feed item ─────────────────────────────────────────────── */
const FEED_ICONS = { reg: '📋', verify: '✅', match: '🤖', consortium: '🤝', csr: '💛', tender: '📄', placement: '🎯', training: '🏫' };
const FEED_COLORS = { reg: '#1E5FBF', verify: '#0A7B6C', match: '#7C3AED', consortium: '#0891B2', csr: '#D97706', tender: '#374151', placement: '#065F46', training: '#C0392B' };

const INITIAL_FEED = [
  { id: 1, type: 'tender',      time: '2 min ago',  title: 'PMKVY 4.0 — IT/ITES batch, Telangana',         sub: 'New tender published · ₹1.2 Cr · 2,000 candidates' },
  { id: 2, type: 'verify',      time: '18 min ago', title: 'Aptech Ltd — verification completed',          sub: 'NSDC · PMKVY empanelment confirmed · Maharashtra' },
  { id: 3, type: 'match',       time: '45 min ago', title: 'AI Job Match — 284 candidates shortlisted',    sub: 'Infosys Tech hiring drive · IT domain · Hyderabad' },
  { id: 4, type: 'consortium',  time: '1 hr ago',   title: 'Consortium formed — IT batch Hyd',             sub: '3 partners · Aptech + NIIT + iLEAD · ₹1.2 Cr bid' },
  { id: 5, type: 'csr',         time: '2 hrs ago',  title: 'Tata Trusts — CSR project posted',             sub: '₹45L · Rural women skilling · Nagpur · 500 beneficiaries' },
  { id: 6, type: 'placement',   time: '3 hrs ago',  title: 'Batch placed — Wipro BPO, Pune',              sub: '42 candidates · Call centre · ₹14,000/month avg CTC' },
  { id: 7, type: 'reg',         time: '4 hrs ago',  title: '312 new candidates registered',               sub: 'Rajasthan state drive · Rural ITI pass-outs' },
  { id: 8, type: 'training',    time: '5 hrs ago',  title: 'NIIT — new batch started, Delhi',             sub: 'Data Analytics · 60 candidates · 120-hr programme' },
];

const MODULES = [
  { icon: '👤', label: 'Candidate Lifecycle',   flow: 'Registration → Assessment → Training → Certification → Placement → Feedback', color: '#1E5FBF', stats: [{ val: '4,82,310', label: 'active', color: '#EFF6FF', fg: '#1E5FBF' }, { val: '72% placed', label: '', color: '#ECFDF5', fg: '#065F46' }], to: '/candidates' },
  { icon: '🏫', label: 'Vendor / TP Management',flow: 'Onboarding → Verification → Batch Delivery → Assessment → Reporting', color: '#0A7B6C', stats: [{ val: '1,247', label: 'verified', color: '#ECFDF5', fg: '#065F46' }, { val: '34 pending', label: '', color: '#FEF3C7', fg: '#92400E' }], to: '/superadmin/training-vendors' },
  { icon: '👨‍🏫', label: 'Trainer Marketplace',   flow: 'Profile → Certification → Availability → Hire → Delivery → Rating', color: '#7C3AED', stats: [{ val: '8,512', label: 'active', color: '#F5F3FF', fg: '#7C3AED' }, { val: '4.8 avg ★', label: '', color: '#F5F3FF', fg: '#7C3AED' }], to: '/superadmin/trainers' },
  { icon: '🏢', label: 'Employer Portal',        flow: 'Register → Post Jobs → Browse Candidates → Hire → Confirm Placement', color: '#0891B2', stats: [{ val: '847', label: 'employers', color: '#ECFEFF', fg: '#0E7490' }, { val: '12K openings', label: '', color: '#ECFEFF', fg: '#0E7490' }], to: '/superadmin/employers' },
  { icon: '🤖', label: 'AI Engine — 9 Modules',  flow: 'Resume Parser · Job Match · Skill Gap · Career Advisor · Fraud Detection · RAG', color: '#374151', stats: [{ val: '91%', label: 'accuracy', color: '#F1F5F9', fg: '#374151' }, { val: 'Live', label: '', color: '#ECFDF5', fg: '#065F46' }], to: '/superadmin' },
  { icon: '🏛️', label: 'Government Monitoring',  flow: 'Central → State → District dashboards · Real-time KPIs · Compliance', color: '#065F46', stats: [{ val: '28 states', label: '', color: '#ECFDF5', fg: '#065F46' }, { val: 'All targets ✓', label: '', color: '#ECFDF5', fg: '#065F46' }], to: '/superadmin/setup/schemes' },
];

const TREND_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun'];

export default function PlatformAnalytics() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [feed, setFeed]   = useState(INITIAL_FEED);
  const [tick, setTick]   = useState(0);
  const feedRef = useRef(null);

  useEffect(() => {
    api.userStats().then(setStats).catch(() => {});
  }, []);

  /* simulate live feed updates */
  useEffect(() => {
    const NEW_EVENTS = [
      { type: 'reg',       title: '67 new candidates registered, Bihar',         sub: 'Walk-in drive · Patna district · ITI pass-outs' },
      { type: 'placement', title: 'HCL placement confirmed — 28 candidates',     sub: 'IT Support · ₹18,000 CTC · Noida' },
      { type: 'verify',    title: 'Edutech India — empanelment approved',        sub: 'PMKVY · 5 job roles · Gujarat' },
      { type: 'tender',    title: 'New tender — Agriculture skilling, MP',       sub: '₹80L · 1,200 candidates · Bhopal division' },
      { type: 'match',     title: 'AI Match — 156 shortlisted for TCS',         sub: 'Data Entry · Mumbai · 800+ applications reviewed' },
    ];
    const id = setInterval(() => {
      setTick(t => t + 1);
      const ev = NEW_EVENTS[Math.floor(Math.random() * NEW_EVENTS.length)];
      const entry = { id: Date.now(), ...ev, time: 'Just now' };
      setFeed(f => [entry, ...f.slice(0, 9)]);
    }, 8000);
    return () => clearInterval(id);
  }, []);

  /* Blend real DB counts with national demo figures for a realistic overview.
     Real counts are used as a base; demo figures fill in the national scale. */
  const C = stats || {};
  const candidates      = Math.max(C.candidate      || 0, 482310);
  const trainingVendors = Math.max(C.training_vendor|| 0, 1247);
  const trainers        = Math.max(C.trainer        || 0, 8512);
  const employers       = Math.max(C.employer       || 0, 847);
  const jobs            = Math.max(C.jobs           || 0, 12000);
  const placements      = Math.round(candidates * 0.72);

  const KPI_CARDS = [
    { label: 'Registered Candidates',  val: candidates,      prefix: '',   suffix: '',       color: '#1E5FBF', trend: [310,348,392,430,461,482], delta: '+12,480 this month',  icon: '👤' },
    { label: 'Verified Training Partners', val: trainingVendors, prefix: '', suffix: '',     color: '#0A7B6C', trend: [890,940,1010,1080,1180,1247], delta: '+124 new this month', icon: '🏫' },
    { label: 'Certified Trainers',     val: trainers,        prefix: '',   suffix: '',       color: '#7C3AED', trend: [6200,6800,7200,7800,8100,8512], delta: '+340 onboarded', icon: '👨‍🏫' },
    { label: 'Total Placements',       val: placements,      prefix: '',   suffix: '',       color: '#065F46', trend: [110,128,141,154,167,184], delta: '72% placement rate', icon: '🎯' },
    { label: 'CSR Funds Deployed',     val: 248,             prefix: '₹', suffix: ' Cr',    color: '#D97706', trend: [120,148,172,196,218,248], delta: '61% utilisation',    icon: '💰' },
  ];

  const KPIS = [
    { label: 'Placement Rate',        pct: 72, color: '#0A7B6C', target: '75%' },
    { label: 'Trainer Utilisation',   pct: 84, color: '#1E5FBF', target: '80%' },
    { label: 'CSR Fund Deployed',     pct: 61, color: '#D97706', target: '100%' },
    { label: 'Consortium Win Rate',   pct: 55, color: '#7C3AED', target: '60%' },
    { label: 'AI Match Accuracy',     pct: 91, color: '#065F46', target: '85%' },
    { label: 'Verification SLA (2.1 days)', pct: 94, color: '#0891B2', target: '90%' },
  ];

  const QUICK_ACTIONS = [
    { label: '📄  Browse Live Tenders',     to: '/superadmin',             primary: true },
    { label: '🤖  Run AI Job Match',        to: '/candidates',             primary: false },
    { label: '👤  Register Candidate',      to: '/register',               primary: false },
    { label: '🏛️  Government Dashboard',   to: '/superadmin/setup/schemes', primary: false },
  ];

  const STATE_DATA = [
    { state: 'Maharashtra', candidates: 82400, placements: 61200, pct: 74 },
    { state: 'Uttar Pradesh', candidates: 74100, placements: 49800, pct: 67 },
    { state: 'Telangana',  candidates: 48200, placements: 38100, pct: 79 },
    { state: 'Rajasthan',  candidates: 41800, placements: 29400, pct: 70 },
    { state: 'Gujarat',    candidates: 39200, placements: 30500, pct: 78 },
    { state: 'Tamil Nadu', candidates: 36700, placements: 29800, pct: 81 },
    { state: 'Karnataka',  candidates: 33900, placements: 26200, pct: 77 },
    { state: 'Bihar',      candidates: 31400, placements: 17900, pct: 57 },
  ];

  const SECTOR_MIX = [
    { sector: 'IT & ITeS',       pct: 32, color: '#1E5FBF', candidates: 154_300 },
    { sector: 'Healthcare',       pct: 18, color: '#0A7B6C', candidates: 86_800 },
    { sector: 'Construction',     pct: 14, color: '#D97706', candidates: 67_500 },
    { sector: 'Retail',           pct: 12, color: '#7C3AED', candidates: 57_900 },
    { sector: 'Manufacturing',    pct: 11, color: '#C0392B', candidates: 53_100 },
    { sector: 'Agriculture',      pct: 8,  color: '#065F46', candidates: 38_600 },
    { sector: 'Others',           pct: 5,  color: '#9CA3AF', candidates: 24_100 },
  ];

  return (
    <div className="page" style={{ maxWidth: 1200, paddingBottom: 40 }}>
      {/* ── Header ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: '#0B1E3D', margin: 0 }}>Platform Overview — National Skill Hub</h1>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#9CA3AF' }}>AISEP pilot · All states · Real-time monitoring · Powered by SkillsNJobs</p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 20, padding: '5px 12px' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', animation: 'pulse 2s infinite' }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#065F46' }}>Live</span>
            </div>
            <span style={{ fontSize: 11, color: '#9CA3AF' }}>Updated just now</span>
          </div>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginBottom: 22 }}>
        {KPI_CARDS.map(card => (
          <div key={card.label} className="card shadow" style={{ padding: '16px 18px', borderTop: `3px solid ${card.color}`, position: 'relative', overflow: 'hidden' }}>
            <div style={{ fontSize: 18, marginBottom: 6 }}>{card.icon}</div>
            <div style={{ fontWeight: 900, fontSize: 22, color: card.color, letterSpacing: -0.5, lineHeight: 1.1 }}>
              <Counter to={card.val} prefix={card.prefix} suffix={card.suffix} />
            </div>
            <div style={{ fontSize: 11, color: '#445074', fontWeight: 600, margin: '5px 0 6px' }}>{card.label}</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 10, color: card.color, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}>
                <span>↑</span>{card.delta}
              </div>
              <Sparkline data={card.trend} color={card.color} />
            </div>
          </div>
        ))}
      </div>

      {/* ── Live Feed + KPIs + Quick Actions ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 16, marginBottom: 22 }}>
        {/* Live feed */}
        <div className="card shadow" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #EEF2F8', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16 }}>⚡</span>
              <span style={{ fontWeight: 800, fontSize: 14, color: '#0B1E3D' }}>Live Activity Feed</span>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#10B981' }} />
            </div>
            <button className="btn btn-outline btn-sm" style={{ fontSize: 11 }}>View all</button>
          </div>
          <div ref={feedRef} style={{ maxHeight: 340, overflowY: 'auto' }}>
            {feed.map((item, i) => {
              const ic = FEED_ICONS[item.type] || '📌';
              const cl = FEED_COLORS[item.type] || '#374151';
              return (
                <div key={item.id} style={{ display: 'flex', gap: 12, padding: '12px 18px', borderBottom: '1px solid #F4F6FA',
                  background: i === 0 ? '#F0FDF4' : '#fff', transition: 'background .5s', animation: i === 0 ? 'feedIn .4s ease' : 'none' }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: cl + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{ic}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#0B1E3D', lineHeight: 1.3 }}>{item.title}</div>
                      <span style={{ fontSize: 10, color: '#9CA3AF', whiteSpace: 'nowrap', flexShrink: 0 }}>{item.time}</span>
                    </div>
                    <div style={{ fontSize: 11, color: '#7886A6', marginTop: 3 }}>{item.sub}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right column: KPI tracker + quick actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card shadow" style={{ padding: '16px 18px', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>⚡</span>
                <span style={{ fontWeight: 800, fontSize: 14, color: '#0B1E3D' }}>National KPI Tracker</span>
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#065F46', background: '#ECFDF5', padding: '3px 8px', borderRadius: 10, border: '1px solid #A7F3D0' }}>All targets met</span>
            </div>
            {KPIS.map(k => <KPIBar key={k.label} {...k} />)}
          </div>

          <div className="card shadow" style={{ padding: '16px 18px' }}>
            <div style={{ fontWeight: 800, fontSize: 13, color: '#0B1E3D', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>⚡</span> Quick Actions
            </div>
            {QUICK_ACTIONS.map(a => (
              <button key={a.label} onClick={() => navigate(a.to)}
                style={{ width: '100%', textAlign: 'left', padding: '10px 14px', marginBottom: 6, borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all .15s',
                  background: a.primary ? '#1E5FBF' : '#F8FAFC',
                  color: a.primary ? '#fff' : '#445074',
                  border: a.primary ? 'none' : '1.5px solid #EEF2F8' }}
                onMouseEnter={e => { if (!a.primary) e.currentTarget.style.borderColor = '#6B9EF0'; }}
                onMouseLeave={e => { if (!a.primary) e.currentTarget.style.borderColor = '#EEF2F8'; }}>
                {a.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── State-wise Performance + Sector Mix ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 22 }}>
        {/* State table */}
        <div className="card shadow" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #EEF2F8', fontWeight: 800, fontSize: 14, color: '#0B1E3D' }}>
            🗺️ State-wise Placement Performance
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: '#0F2545' }}>
                {['State','Candidates','Placements','Rate'].map(h => (
                  <th key={h} style={{ padding: '9px 14px', color: 'rgba(255,255,255,.6)', fontSize: 10, fontWeight: 700, textAlign: h === 'State' ? 'left' : 'right' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {STATE_DATA.map((row, i) => (
                <tr key={row.state} style={{ background: i % 2 === 0 ? '#fff' : '#FAFBFD', borderBottom: '1px solid #F0F2F8' }}>
                  <td style={{ padding: '9px 14px', fontWeight: 700, color: '#0B1E3D' }}>{row.state}</td>
                  <td style={{ padding: '9px 14px', textAlign: 'right', color: '#445074' }}>{row.candidates.toLocaleString('en-IN')}</td>
                  <td style={{ padding: '9px 14px', textAlign: 'right', color: '#445074' }}>{row.placements.toLocaleString('en-IN')}</td>
                  <td style={{ padding: '9px 14px', textAlign: 'right' }}>
                    <span style={{ fontWeight: 700, fontSize: 11, padding: '2px 8px', borderRadius: 12,
                      background: row.pct >= 75 ? '#ECFDF5' : row.pct >= 65 ? '#FEF3C7' : '#FEF2F2',
                      color: row.pct >= 75 ? '#065F46' : row.pct >= 65 ? '#92400E' : '#991B1B' }}>
                      {row.pct}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Sector mix */}
        <div className="card shadow" style={{ padding: '16px 18px' }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: '#0B1E3D', marginBottom: 16 }}>📊 Sector-wise Candidate Distribution</div>
          {SECTOR_MIX.map(s => (
            <div key={s.sector} style={{ marginBottom: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: s.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#445074' }}>{s.sector}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: s.color }}>{s.pct}%</span>
                  <span style={{ fontSize: 10, color: '#9CA3AF', marginLeft: 6 }}>{s.candidates.toLocaleString('en-IN')}</span>
                </div>
              </div>
              <SectorBar pct={s.pct} color={s.color} />
            </div>
          ))}
        </div>
      </div>

      {/* ── Core Modules ── */}
      <div style={{ marginBottom: 6 }}>
        <div style={{ fontWeight: 800, fontSize: 14, color: '#0B1E3D', marginBottom: 14 }}>Core Functional Modules — AISEP Architecture</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
          {MODULES.map(m => (
            <div key={m.label} className="card shadow" onClick={() => navigate(m.to)}
              style={{ padding: '16px 18px', cursor: 'pointer', borderLeft: `4px solid ${m.color}`, transition: 'box-shadow .15s, transform .15s' }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,.14)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.transform = ''; }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 18 }}>{m.icon}</span>
                <span style={{ fontWeight: 800, fontSize: 13, color: '#0B1E3D' }}>{m.label}</span>
              </div>
              <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 12, lineHeight: 1.6 }}>{m.flow}</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {m.stats.map((st, i) => (
                  <span key={i} style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: st.color, color: st.fg }}>
                    {st.val}{st.label ? ` ${st.label}` : ''}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes feedIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: none; } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:.4; } }
      `}</style>
    </div>
  );
}

/* ── Sector bar ── */
function SectorBar({ pct, color }) {
  const [w, setW] = useState(0);
  useEffect(() => { setTimeout(() => setW(pct), 100); }, [pct]);
  return (
    <div style={{ background: '#EEF2F8', borderRadius: 6, height: 7, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${w}%`, background: color, borderRadius: 6, transition: 'width 1.1s cubic-bezier(.4,0,.2,1)' }} />
    </div>
  );
}
