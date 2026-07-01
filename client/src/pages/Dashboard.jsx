import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api.js';

/* ── Mock data ─────────────────────────────────────────────────── */
const MOCK_NOTIFICATIONS = [
  { id: 1, icon: '📋', text: 'Your application for "Junior Data Analyst" was shortlisted.', time: '2h ago', unread: true },
  { id: 2, icon: '🎓', text: 'You completed 60% of "SQL for Data Analysis".', time: '1d ago', unread: true },
  { id: 3, icon: '💼', text: 'New job matching your skills: React Developer.', time: '2d ago', unread: false },
];
const MOCK_GOVT_SCHEMES = [
  { id: 1, name: 'PM Kaushal Vikas Yojana', short: 'PMKVY', tag: 'Free Training', tagColor: '#10B981', tagBg: '#D1FAE5', icon: '🏛️', desc: 'Industry-relevant skill training with certification & stipend.' },
  { id: 2, name: 'National Apprenticeship Promotion', short: 'NAPS', tag: 'Apprenticeship', tagColor: '#7C3AED', tagBg: '#EDE9FE', icon: '🤝', desc: 'Govt shares 25% of stipend for apprentices with employers.' },
  { id: 3, name: 'Startup India Skill Development', short: 'SISD', tag: 'Entrepreneurship', tagColor: '#D97706', tagBg: '#FEF3C7', icon: '🚀', desc: 'Mentorship + funding for skill-based startup ideas.' },
];
const MOCK_APPRENTICESHIPS = [
  { id: 1, title: 'IT Support Apprentice', org: 'TCS Foundation', location: 'Bengaluru', duration: '6 mo', stipend: '₹8,000/mo', color: '#3B82F6' },
  { id: 2, title: 'Data Entry Trainee', org: 'NSDC Partner', location: 'Hyderabad', duration: '3 mo', stipend: '₹5,000/mo', color: '#10B981' },
  { id: 3, title: 'Web Dev Intern (React)', org: 'TechNova Pvt Ltd', location: 'Remote', duration: '4 mo', stipend: '₹12,000/mo', color: '#8B5CF6' },
];
const MOCK_ENROLLMENTS = [
  { id: 1, title: 'SQL for Data Analysis', provider: 'Skillbridge Academy', progress: 60, color: '#3B82F6' },
  { id: 2, title: 'Power BI Fundamentals', provider: 'Skillbridge Academy', progress: 20, color: '#8B5CF6' },
];
const MOCK_CERTS = [
  { id: 1, title: 'HTML & CSS Basics', issuer: 'W3Schools', date: 'Nov 2023' },
  { id: 2, title: 'Python for Beginners', issuer: 'Coursera', date: 'Feb 2024' },
];

function profileCompletion(user) {
  const fields = ['first_name','last_name','dob','gender','phone','address_line1','city','state_name','pincode','qualification','employment_status'];
  return Math.round(fields.filter(k => user[k]).length / fields.length * 100);
}

/* ── Tiny helpers ───────────────────────────────────────────────── */
function Tag({ label, color, bg }) {
  return <span style={{ fontSize: 11, fontWeight: 700, color, background: bg, padding: '3px 9px', borderRadius: 99 }}>{label}</span>;
}

function SectionTitle({ icon, title, action, onAction, light }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
      <div style={{ fontWeight: 800, fontSize: 14, color: light ? 'rgba(255,255,255,.9)' : 'var(--navy)', display: 'flex', alignItems: 'center', gap: 7 }}>
        <span>{icon}</span>{title}
      </div>
      {action && <span style={{ fontSize: 12, fontWeight: 700, color: light ? 'rgba(255,255,255,.7)' : 'var(--blue)', cursor: 'pointer' }} onClick={onAction}>{action} →</span>}
    </div>
  );
}

/* ── Employer / non-candidate fallback ─────────────────────────── */
function EmployerDashboard({ user, stats, jobs, navigate }) {
  const kpis = stats ? [
    { icon: '📋', label: 'My Postings', val: stats.myJobs ?? 0, g: 'linear-gradient(135deg,#1E5FBF,#3B82F6)' },
    { icon: '👥', label: 'Applicants', val: stats.myApplicants ?? 0, g: 'linear-gradient(135deg,#059669,#10B981)' },
    { icon: '🧑‍💼', label: 'Candidates', val: stats.candidates, g: 'linear-gradient(135deg,#D97706,#F59E0B)' },
    { icon: '✅', label: 'Hired', val: stats.hired, g: 'linear-gradient(135deg,#7C3AED,#8B5CF6)' },
  ] : [];
  return (
    <div className="page">
      <div className="page-header"><h1>Welcome back, {(user.name||'').split(' ')[0]} 👋</h1><p>Manage postings and find the right talent.</p></div>
      <div className="grid grid-4" style={{ marginBottom: 22 }}>
        {kpis.map(k => (
          <div key={k.label} style={{ background: k.g, borderRadius: 18, padding: '18px 20px', color: '#fff', boxShadow: '0 4px 16px rgba(0,0,0,.15)' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{k.icon}</div>
            <div style={{ fontSize: 30, fontWeight: 800, lineHeight: 1 }}>{k.val ?? '—'}</div>
            <div style={{ fontSize: 12, opacity: .8, marginTop: 4 }}>{k.label}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-2">
        <div className="card shadow">
          <SectionTitle icon="📌" title="Recent Job Postings" action="View all" onAction={() => navigate('/my-jobs')} />
          {jobs.map(j => (
            <div className="list-item" key={j.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/jobs/${j.id}`)}>
              <div><div style={{ fontWeight: 700, fontSize: 13.5 }}>{j.title}</div><div className="muted">{j.location||'Remote'} · {j.job_type}</div></div>
              <Tag label={j.status} color={j.status==='open'?'#065F46':'#991B1B'} bg={j.status==='open'?'#D1FAE5':'#FEE2E2'} />
            </div>
          ))}
        </div>
        <div className="card shadow">
          <SectionTitle icon="⚡" title="Quick Actions" />
          <button className="btn btn-primary btn-block" style={{ marginBottom: 10 }} onClick={() => navigate('/my-jobs')}>+ Post a New Job</button>
          <button className="btn btn-outline btn-block" style={{ marginBottom: 10 }} onClick={() => navigate('/candidates')}>Browse Candidates</button>
          <button className="btn btn-outline btn-block" onClick={() => navigate('/courses')}>Explore Courses</button>
        </div>
      </div>
    </div>
  );
}

/* ── Main candidate dashboard ───────────────────────────────────── */
export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [recs, setRecs] = useState(null);
  const [notifOpen, setNotifOpen] = useState(false);

  useEffect(() => {
    api.stats().then(setStats).catch(() => {});
    api.jobs().then(r => setJobs(r.slice(0, 4))).catch(() => {});
    if (user.role === 'candidate') api.recommendations().then(setRecs).catch(() => {});
  }, [user.role]);

  const isCandidate = user.role === 'candidate';
  const isFresher = ['Fresher', 'Student'].includes(user.employment_status);
  if (!isCandidate) return <EmployerDashboard user={user} stats={stats} jobs={jobs} navigate={navigate} />;

  const completion = profileCompletion(user);
  const firstName = user.first_name || user.name?.split(' ')[0] || 'there';
  const initials = [user.first_name, user.last_name].filter(Boolean).map(n => n[0]).join('').toUpperCase() || user.name?.slice(0,2).toUpperCase() || 'U';
  const unread = MOCK_NOTIFICATIONS.filter(n => n.unread).length;

  const skillPassport = {
    skills: user.skills || [],
    qualification: user.qualification || '',
    sector: user.preferred_sector || '',
    languages: [user.lang_english && `English · ${user.lang_english}`, user.lang_hindi && `Hindi · ${user.lang_hindi}`, user.lang_regional].filter(Boolean),
  };

  const kpiCards = [
    { icon: '💼', label: 'Open Jobs', val: stats?.openJobs, g: 'linear-gradient(135deg,#1E5FBF 0%,#60A5FA 100%)', shadow: 'rgba(30,95,191,.35)' },
    { icon: '📋', label: 'My Applications', val: stats?.myApplications ?? 0, g: 'linear-gradient(135deg,#D97706 0%,#FCD34D 100%)', shadow: 'rgba(217,119,6,.35)' },
    { icon: '📚', label: 'Enrollments', val: stats?.myEnrollments ?? 0, g: 'linear-gradient(135deg,#059669 0%,#34D399 100%)', shadow: 'rgba(5,150,105,.35)' },
    { icon: '🎓', label: 'Courses', val: stats?.courses, g: 'linear-gradient(135deg,#7C3AED 0%,#C084FC 100%)', shadow: 'rgba(124,58,237,.35)' },
  ];

  return (
    <div className="page" style={{ maxWidth: 1140, paddingTop: 0 }}>

      {/* ════════ HERO HEADER ════════ */}
      <div style={{
        background: 'linear-gradient(135deg, #0B1E3D 0%, #1E3A6E 50%, #0A7B6C 100%)',
        borderRadius: '0 0 32px 32px', padding: '32px 28px 40px', marginBottom: 28,
        position: 'relative', overflow: 'hidden',
      }}>
        {/* decorative circles */}
        <div style={{ position: 'absolute', top: -40, right: -40, width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,.04)' }} />
        <div style={{ position: 'absolute', bottom: -60, right: 80, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,.03)' }} />
        <div style={{ position: 'absolute', top: 20, right: 200, width: 80, height: 80, borderRadius: '50%', background: 'rgba(10,123,108,.3)' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, position: 'relative' }}>
          {/* Left: avatar + greeting */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: user.photo ? `url(${user.photo}) center/cover` : 'linear-gradient(135deg,#3B82F6,#10B981)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, fontWeight: 800, color: '#fff',
              border: '3px solid rgba(255,255,255,.25)', flexShrink: 0,
            }}>
              {!user.photo && initials}
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.55)', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>
                Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'} 👋
              </div>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: '#fff', fontFamily: 'var(--display)', marginBottom: 4 }}>
                {firstName}!
              </h1>
              <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,.6)' }}>
                {user.employment_status ? `${user.employment_status} · ` : ''}{user.preferred_sector || 'SkillsNJobs Member'}
              </div>
            </div>
          </div>

          {/* Right: notification + profile % */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
            {/* Notification bell */}
            <div style={{ position: 'relative' }}>
              <button onClick={() => setNotifOpen(o => !o)}
                style={{ background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.2)', borderRadius: 12, padding: '9px 16px', color: '#fff', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', backdropFilter: 'blur(8px)' }}>
                🔔 Notifications
                {unread > 0 && (
                  <span style={{ background: '#EF4444', color: '#fff', fontSize: 10, fontWeight: 800, width: 18, height: 18, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{unread}</span>
                )}
              </button>
              {notifOpen && (
                <div style={{ position: 'absolute', right: 0, top: 48, width: 340, background: '#fff', borderRadius: 16, boxShadow: '0 12px 40px rgba(0,0,0,.18)', zIndex: 200, overflow: 'hidden', border: '1px solid var(--border)' }}>
                  <div style={{ padding: '14px 18px', fontWeight: 800, fontSize: 13, borderBottom: '1px solid var(--border)', color: 'var(--navy)' }}>🔔 Notifications</div>
                  {MOCK_NOTIFICATIONS.map(n => (
                    <div key={n.id} style={{ padding: '12px 18px', borderBottom: '1px solid #F1F5F9', background: n.unread ? '#F0F9FF' : '#fff', display: 'flex', gap: 12 }}>
                      <span style={{ fontSize: 20, flexShrink: 0 }}>{n.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12.5, color: 'var(--ink-1)', lineHeight: 1.4 }}>{n.text}</div>
                        <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 4 }}>{n.time}</div>
                      </div>
                      {n.unread && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3B82F6', flexShrink: 0, marginTop: 4 }} />}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Profile completion pill */}
            <div style={{ background: 'rgba(255,255,255,.1)', borderRadius: 12, padding: '10px 16px', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,.15)' }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.65)', marginBottom: 6 }}>Profile Completion</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 120, height: 6, background: 'rgba(255,255,255,.2)', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: completion + '%', background: completion >= 80 ? '#34D399' : '#FBBF24', borderRadius: 99, transition: 'width .4s' }} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 800, color: completion >= 80 ? '#34D399' : '#FBBF24' }}>{completion}%</span>
              </div>
              {completion < 80 && (
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.5)', marginTop: 5, cursor: 'pointer' }} onClick={() => navigate('/profile')}>
                  Complete profile for better matches →
                </div>
              )}
            </div>
          </div>
        </div>

        {/* KPI cards inside hero */}
        <div className="grid grid-4" style={{ marginTop: 28, gap: 12 }}>
          {kpiCards.map(k => (
            <div key={k.label} style={{
              background: 'rgba(255,255,255,.08)', borderRadius: 16, padding: '16px 18px',
              border: '1px solid rgba(255,255,255,.12)', backdropFilter: 'blur(8px)',
              display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: k.g, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0, boxShadow: `0 4px 12px ${k.shadow}` }}>
                {k.icon}
              </div>
              <div>
                <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{k.val ?? '—'}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.6)', marginTop: 3 }}>{k.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ════════ MAIN GRID ════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 340px', gap: 20, alignItems: 'start' }}>

        {/* ── LEFT COLUMN ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* AI Recommended Courses — purple gradient header */}
          <div style={{ borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 20px rgba(124,58,237,.15)', border: '1px solid #EDE9FE' }}>
            <div style={{ background: 'linear-gradient(135deg,#4C1D95,#7C3AED,#A855F7)', padding: '18px 20px' }}>
              <SectionTitle icon="🤖" title="AI Recommended Courses" action="Browse all" onAction={() => navigate('/courses')} light />
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,.65)' }}>Personalised based on your profile and skill gaps</div>
            </div>
            <div style={{ background: '#fff', padding: '16px 20px' }}>
              {!recs && <div style={{ color: 'var(--ink-3)', fontSize: 13, padding: '12px 0' }}>✨ Analysing your profile…</div>}
              {recs && recs.topSkillGaps.length === 0 && <div className="empty" style={{ padding: '24px 0' }}>You match all required skills 🎉</div>}
              {recs && recs.topSkillGaps.length > 0 && (
                <>
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', marginBottom: 8, letterSpacing: .5 }}>SKILL GAPS TO CLOSE</div>
                    <div className="chip-row">
                      {recs.topSkillGaps.map(s => <span key={s} className="chip missing">{s}</span>)}
                    </div>
                  </div>
                  {recs.recommendedCourses.slice(0, 3).map(c => (
                    <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#FAF5FF', borderRadius: 12, marginBottom: 8, cursor: 'pointer', border: '1px solid #EDE9FE' }} onClick={() => navigate('/courses')}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--navy)' }}>{c.title}</div>
                        <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{c.provider} · {c.duration_weeks} weeks</div>
                      </div>
                      <Tag label={`Closes ${c.relevance} gap${c.relevance > 1 ? 's' : ''}`} color="#7C3AED" bg="#EDE9FE" />
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Open Jobs */}
          <div className="card shadow" style={{ borderRadius: 20 }}>
            <SectionTitle icon="💼" title="Open Jobs For You" action="View all" onAction={() => navigate('/jobs')} />
            {jobs.length === 0 && <div className="empty" style={{ padding: '24px 0' }}>No jobs posted yet.</div>}
            {jobs.map(j => (
              <div key={j.id} onClick={() => navigate(`/jobs/${j.id}`)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: '#F8FAFC', borderRadius: 12, marginBottom: 8, cursor: 'pointer', border: '1px solid var(--border)', transition: 'box-shadow .15s' }}
                onMouseOver={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,.08)'}
                onMouseOut={e => e.currentTarget.style.boxShadow = 'none'}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg,#EBF3FF,#DBEAFE)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>🏢</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--navy)' }}>{j.title}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 2 }}>{j.employer_name || 'Employer'} · {j.location || 'Remote'}</div>
                  </div>
                </div>
                {typeof j.match_score === 'number' && (
                  <div style={{ textAlign: 'center', flexShrink: 0 }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: j.match_score >= 70 ? '#059669' : 'var(--blue)' }}>{j.match_score}%</div>
                    <div style={{ fontSize: 10, color: 'var(--ink-3)' }}>match</div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Apprenticeships */}
          <div className="card shadow" style={{ borderRadius: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--navy)' }}>🔧 Apprenticeships</span>
                {isFresher && <Tag label="Recommended" color="#1D4ED8" bg="#DBEAFE" />}
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--blue)', cursor: 'pointer' }}>View all →</span>
            </div>
            {MOCK_APPRENTICESHIPS.map(a => (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 12, marginBottom: 8, border: '1px solid var(--border)', background: '#FAFBFF' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: a.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🔧</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--navy)' }}>{a.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{a.org} · {a.location}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#059669' }}>{a.stipend}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{a.duration}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Government Schemes — teal gradient header */}
          <div style={{ borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 20px rgba(5,150,105,.12)', border: '1px solid #D1FAE5' }}>
            <div style={{ background: 'linear-gradient(135deg,#064E3B,#059669,#34D399)', padding: '18px 20px' }}>
              <SectionTitle icon="🏛️" title="Government Schemes" light />
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,.65)' }}>Live feed from National Skill Development portals</div>
            </div>
            <div style={{ background: '#fff', padding: '12px 16px' }}>
              {MOCK_GOVT_SCHEMES.map(s => (
                <div key={s.id} style={{ display: 'flex', gap: 14, padding: '14px 0', borderBottom: '1px solid #F1F5F9' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{s.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--navy)' }}>{s.name}</span>
                      <Tag label={s.tag} color={s.tagColor} bg={s.tagBg} />
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 6 }}>{s.desc}</div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#059669', cursor: 'pointer' }}>Learn more →</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* ── RIGHT COLUMN ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Learning Progress */}
          <div className="card shadow" style={{ borderRadius: 20 }}>
            <SectionTitle icon="📊" title="Learning Progress" action="All courses" onAction={() => navigate('/courses')} />
            {MOCK_ENROLLMENTS.map(e => (
              <div key={e.id} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--navy)' }}>{e.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{e.provider}</div>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 800, color: e.color }}>{e.progress}%</span>
                </div>
                <div style={{ height: 8, background: '#F1F5F9', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: e.progress + '%', background: `linear-gradient(90deg,${e.color},${e.color}99)`, borderRadius: 99, transition: 'width .5s ease' }} />
                </div>
              </div>
            ))}
          </div>

          {/* Applications */}
          <div className="card shadow" style={{ borderRadius: 20, background: 'linear-gradient(135deg,#FEF3C7,#FFFBEB)', border: '1px solid #FDE68A' }}>
            <SectionTitle icon="📋" title="My Applications" action="View all" onAction={() => navigate('/applications')} />
            <div style={{ textAlign: 'center', padding: '10px 0 16px' }}>
              <div style={{ fontSize: 48, fontWeight: 900, color: '#D97706', lineHeight: 1 }}>{stats?.myApplications ?? 0}</div>
              <div style={{ fontSize: 12, color: '#92400E', fontWeight: 600, marginTop: 6 }}>Active Applications</div>
              <button className="btn btn-sm" style={{ marginTop: 14, background: '#D97706', color: '#fff', border: 'none' }} onClick={() => navigate('/applications')}>
                Track Status →
              </button>
            </div>
          </div>

          {/* Certificates */}
          <div className="card shadow" style={{ borderRadius: 20 }}>
            <SectionTitle icon="🎓" title="My Certificates" />
            {MOCK_CERTS.map(c => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: '#FFF7ED', borderRadius: 12, marginBottom: 8, border: '1px solid #FED7AA' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#F59E0B,#FBBF24)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>🏅</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 12.5, color: 'var(--navy)' }}>{c.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{c.issuer} · {c.date}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Skill Passport */}
          <div style={{ background: 'linear-gradient(135deg,#0B1E3D 0%,#1E3A6E 60%,#1E5FBF 100%)', borderRadius: 20, padding: '18px 20px', boxShadow: '0 8px 28px rgba(11,30,61,.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontWeight: 800, fontSize: 15, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>🏆 Skill Passport</div>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.6)', cursor: 'pointer' }} onClick={() => navigate('/profile')}>Edit profile →</span>
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.45)', marginBottom: 16 }}>Your verified skill summary</div>
            {!skillPassport.skills.length && !skillPassport.qualification ? (
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,.5)', background: 'rgba(255,255,255,.06)', borderRadius: 12, padding: '16px', textAlign: 'center' }}>
                Complete your profile to build your Skill Passport
              </div>
            ) : (
              <>
                {skillPassport.qualification && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.4)', letterSpacing: 1, marginBottom: 6 }}>EDUCATION</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{skillPassport.qualification}</div>
                  </div>
                )}
                {skillPassport.skills.length > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.4)', letterSpacing: 1, marginBottom: 8 }}>SKILLS</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {skillPassport.skills.map(s => (
                        <span key={s} style={{ background: 'rgba(255,255,255,.12)', color: '#fff', fontSize: 11.5, fontWeight: 600, padding: '4px 11px', borderRadius: 99, border: '1px solid rgba(255,255,255,.15)' }}>{s}</span>
                      ))}
                    </div>
                  </div>
                )}
                {skillPassport.sector && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.4)', letterSpacing: 1, marginBottom: 6 }}>PREFERRED SECTOR</div>
                    <Tag label={skillPassport.sector} color="#fff" bg="rgba(255,255,255,.15)" />
                  </div>
                )}
                {skillPassport.languages.length > 0 && (
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.4)', letterSpacing: 1, marginBottom: 8 }}>LANGUAGES</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {skillPassport.languages.map(l => (
                        <span key={l} style={{ background: 'rgba(10,123,108,.4)', color: '#5EEAD4', fontSize: 11, fontWeight: 600, padding: '4px 11px', borderRadius: 99 }}>{l}</span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
