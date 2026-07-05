import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api.js';

/* ── Mock data ─────────────────────────────────────────────────── */
const MOCK_NOTIFICATIONS = [
  { id: 1, text: 'Your application for "Junior Data Analyst" was shortlisted.', time: '2h ago', unread: true },
  { id: 2, text: 'You completed 60% of "SQL for Data Analysis".', time: '1d ago', unread: true },
  { id: 3, text: 'New job matching your skills: React Developer.', time: '2d ago', unread: false },
];
const MOCK_GOVT_SCHEMES = [
  { id: 1, name: 'PM Kaushal Vikas Yojana', tag: 'Free Training', desc: 'Industry-relevant skill training with certification & stipend.' },
  { id: 2, name: 'National Apprenticeship Promotion (NAPS)', tag: 'Apprenticeship', desc: 'Govt shares 25% of stipend for apprentices with employers.' },
  { id: 3, name: 'Startup India Skill Development', tag: 'Entrepreneurship', desc: 'Mentorship and funding for skill-based startup ideas.' },
];
const MOCK_APPRENTICESHIPS = [
  { id: 1, title: 'IT Support Apprentice', org: 'TCS Foundation', location: 'Bengaluru', duration: '6 mo', stipend: '₹8,000/mo' },
  { id: 2, title: 'Data Entry Trainee', org: 'NSDC Partner', location: 'Hyderabad', duration: '3 mo', stipend: '₹5,000/mo' },
  { id: 3, title: 'Web Dev Intern (React)', org: 'TechNova Pvt Ltd', location: 'Remote', duration: '4 mo', stipend: '₹12,000/mo' },
];
const MOCK_ENROLLMENTS = [
  { id: 1, title: 'SQL for Data Analysis', provider: 'Skillbridge Academy', progress: 60 },
  { id: 2, title: 'Power BI Fundamentals', provider: 'Skillbridge Academy', progress: 20 },
];
const MOCK_CERTS = [
  { id: 1, title: 'HTML & CSS Basics', issuer: 'W3Schools', date: 'Nov 2023' },
  { id: 2, title: 'Python for Beginners', issuer: 'Coursera', date: 'Feb 2024' },
];

function profileCompletion(user) {
  const fields = ['first_name','last_name','dob','gender','phone','address_line1','city','state_name','pincode','qualification','employment_status'];
  return Math.round(fields.filter(k => user[k]).length / fields.length * 100);
}

function SectionHead({ title, action, onAction }) {
  return (
    <div style={{ background: '#F8FAFC', margin: '-18px -18px 14px -18px', padding: '10px 16px', borderRadius: '12px 12px 0 0', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontWeight: 700, fontSize: 13, color: '#003366' }}>{title}</span>
      {action && (
        <span style={{ fontSize: 12, color: '#007B5E', cursor: 'pointer', fontWeight: 600 }} onClick={onAction}>
          {action} →
        </span>
      )}
    </div>
  );
}

function EmployerDashboard({ user, stats, jobs, navigate }) {
  return (
    <div className="page">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Welcome back, {user.first_name || user.name}. Here's your overview.</p>
      </div>
      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        {[
          { label: 'My Postings', val: stats?.myJobs ?? 0, color: 'var(--blue)' },
          { label: 'Applicants', val: stats?.myApplicants ?? 0, color: 'var(--teal)' },
          { label: 'Candidates', val: stats?.candidates ?? 0, color: 'var(--gold)' },
          { label: 'Hired', val: stats?.hired ?? 0, color: '#059669' },
        ].map(k => (
          <div key={k.label} className="kpi shadow">
            <div className="val" style={{ color: k.color }}>{k.val}</div>
            <div className="lbl">{k.label}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-2">
        <div className="card shadow">
          <SectionHead title="Recent Job Postings" action="View all" onAction={() => navigate('/my-jobs')} />
          {jobs.map(j => (
            <div className="list-item" key={j.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/jobs/${j.id}`)}>
              <div><div style={{ fontWeight: 600, fontSize: 13 }}>{j.title}</div><div className="muted">{j.location || 'Remote'} · {j.job_type}</div></div>
              <span className={`badge ${j.status === 'open' ? 'b-teal' : 'b-coral'}`}>{j.status}</span>
            </div>
          ))}
        </div>
        <div className="card shadow">
          <SectionHead title="Quick Actions" />
          <button className="btn btn-primary btn-block" style={{ marginBottom: 8 }} onClick={() => navigate('/my-jobs')}>+ Post a New Job</button>
          <button className="btn btn-outline btn-block" style={{ marginBottom: 8 }} onClick={() => navigate('/candidates')}>Browse Candidates</button>
          <button className="btn btn-outline btn-block" onClick={() => navigate('/courses')}>Explore Courses</button>
        </div>
      </div>
    </div>
  );
}

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

  if (user.role !== 'candidate') {
    return <EmployerDashboard user={user} stats={stats} jobs={jobs} navigate={navigate} />;
  }

  const completion = profileCompletion(user);
  const firstName = user.first_name || user.name?.split(' ')[0] || 'there';
  const unread = MOCK_NOTIFICATIONS.filter(n => n.unread).length;
  const isFresher = ['Fresher', 'Student'].includes(user.employment_status);

  return (
    <div className="page" style={{ paddingTop: 20 }}>

      {/* ── Page header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--display)', fontSize: 20, fontWeight: 800, color: 'var(--navy)', marginBottom: 2 }}>
            Welcome, {firstName}
          </h1>
          <p style={{ color: 'var(--ink-3)', fontSize: 13 }}>
            {user.employment_status || 'Candidate'}{user.preferred_sector ? ` · ${user.preferred_sector}` : ''}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Profile completion */}
          {completion < 100 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '1px solid var(--border)', borderRadius: 9, padding: '6px 12px', cursor: 'pointer' }} onClick={() => navigate('/profile')}>
              <div style={{ width: 70, height: 5, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: completion + '%', background: completion >= 80 ? 'var(--teal)' : 'var(--gold)', borderRadius: 99 }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-2)' }}>{completion}% profile</span>
            </div>
          )}

          {/* Notification bell */}
          <div style={{ position: 'relative' }}>
            <button onClick={() => setNotifOpen(o => !o)}
              style={{ border: '1px solid var(--border)', background: '#fff', borderRadius: 9, padding: '6px 12px', fontSize: 13, color: 'var(--navy)', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontWeight: 600 }}>
              🔔
              {unread > 0 && (
                <span style={{ background: 'var(--coral)', color: '#fff', fontSize: 10, fontWeight: 800, width: 16, height: 16, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {unread}
                </span>
              )}
            </button>
            {notifOpen && (
              <div style={{ position: 'absolute', right: 0, top: 40, width: 310, background: '#fff', borderRadius: 10, boxShadow: 'var(--shadow)', zIndex: 200, border: '1px solid var(--border)', overflow: 'hidden' }}>
                <div style={{ padding: '10px 14px', fontWeight: 700, fontSize: 13, borderBottom: '1px solid var(--border)', color: 'var(--navy)' }}>Notifications</div>
                {MOCK_NOTIFICATIONS.map(n => (
                  <div key={n.id} style={{ padding: '10px 14px', borderBottom: '1px solid #F1F5F9', background: n.unread ? 'var(--blue-pale)' : '#fff', display: 'flex', gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12.5, color: 'var(--ink)', lineHeight: 1.5 }}>{n.text}</div>
                      <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{n.time}</div>
                    </div>
                    {n.unread && <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--blue)', flexShrink: 0, marginTop: 5 }} />}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── KPI row ── */}
      <div className="grid grid-4" style={{ marginBottom: 18 }}>
        {[
          { label: 'Open Jobs', val: stats?.openJobs, color: 'var(--blue)' },
          { label: 'My Applications', val: stats?.myApplications ?? 0, color: 'var(--gold)' },
          { label: 'Enrollments', val: stats?.myEnrollments ?? 0, color: 'var(--teal)' },
          { label: 'Courses', val: stats?.courses, color: '#7C3AED' },
        ].map(k => (
          <div key={k.label} className="kpi shadow">
            <div className="val" style={{ color: k.color }}>{k.val ?? '—'}</div>
            <div className="lbl">{k.label}</div>
          </div>
        ))}
      </div>

      {/* ── 3-column section grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 22 }}>

        {/* Row 1 — Open Jobs */}
        <div className="card shadow">
          <SectionHead title="💼 Open Jobs For You" action="View all" onAction={() => navigate('/jobs')} bg="#EBF3FF" />
          {jobs.length === 0 && <p className="muted" style={{ fontSize: 12.5 }}>No jobs posted yet.</p>}
          {jobs.map(j => (
            <div key={j.id} className="list-item" style={{ cursor: 'pointer' }} onClick={() => navigate(`/jobs/${j.id}`)}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{j.title}</div>
                <div className="muted">{j.employer_name || 'Employer'} · {j.location || 'Remote'}</div>
              </div>
              {typeof j.match_score === 'number' && (
                <span className="badge b-teal">{j.match_score}% match</span>
              )}
            </div>
          ))}
        </div>

        {/* Row 1 — Apprenticeships */}
        <div className="card shadow">
          <div style={{ background: '#F8FAFC', margin: '-18px -18px 14px -18px', padding: '10px 16px', borderRadius: '12px 12px 0 0', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: 13, color: '#003366' }}>🔧 Apprenticeships</span>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {isFresher && <span className="badge b-blue">Recommended</span>}
              <span style={{ fontSize: 12, color: '#007B5E', cursor: 'pointer', fontWeight: 600 }}>View all →</span>
            </div>
          </div>
          {MOCK_APPRENTICESHIPS.map(a => (
            <div key={a.id} className="list-item">
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{a.title}</div>
                <div className="muted">{a.org} · {a.location} · {a.duration}</div>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--teal)', whiteSpace: 'nowrap' }}>{a.stipend}</span>
            </div>
          ))}
        </div>

        {/* Row 1 — My Applications */}
        <div className="card shadow" style={{ marginLeft: 14 }}>
          <SectionHead title="📋 My Applications" action="View all" onAction={() => navigate('/applications')} bg="#FEF6E4" />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0 10px' }}>
            <span style={{ fontSize: 13, color: 'var(--ink-2)' }}>Active applications</span>
            <span style={{ fontSize: 28, fontWeight: 800, color: 'var(--navy)' }}>{stats?.myApplications ?? 0}</span>
          </div>
          <button className="btn btn-outline btn-block btn-sm" onClick={() => navigate('/applications')}>Track Status</button>
        </div>

        {/* Row 2 — Government Schemes */}
        <div className="card shadow">
          <SectionHead title="🏛️ Government Schemes" bg="#E4F5F2" />
          {MOCK_GOVT_SCHEMES.map(s => (
            <div key={s.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--navy)' }}>{s.name}</span>
                <span className="badge b-teal">{s.tag}</span>
              </div>
              <p className="muted" style={{ fontSize: 12, lineHeight: 1.5, marginBottom: 3 }}>{s.desc}</p>
              <span style={{ fontSize: 12, color: 'var(--blue)', fontWeight: 600, cursor: 'pointer' }}>Learn more →</span>
            </div>
          ))}
        </div>

        {/* Row 2 — AI Recommended Courses */}
        <div className="card shadow">
          <SectionHead title="🤖 AI Recommended Courses" action="Browse all" onAction={() => navigate('/courses')} bg="#F3EFFE" />
          {!recs && <p className="muted" style={{ fontSize: 12.5 }}>Analysing your profile…</p>}
          {recs && recs.topSkillGaps.length === 0 && (
            <p className="muted" style={{ fontSize: 12.5 }}>You match all required skills. 🎉</p>
          )}
          {recs && recs.topSkillGaps.length > 0 && (
            <>
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: .4, marginBottom: 6 }}>Skill gaps to close</div>
                <div className="chip-row">
                  {recs.topSkillGaps.map(s => <span key={s} className="chip missing">{s}</span>)}
                </div>
              </div>
              {recs.recommendedCourses.slice(0, 3).map(c => (
                <div key={c.id} className="list-item" style={{ cursor: 'pointer' }} onClick={() => navigate('/courses')}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{c.title}</div>
                    <div className="muted">{c.provider} · {c.duration_weeks} weeks</div>
                  </div>
                  <span className="badge b-blue">Closes {c.relevance} gap{c.relevance > 1 ? 's' : ''}</span>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Row 2 — Learning Progress */}
        <div className="card shadow" style={{ marginLeft: 14 }}>
          <SectionHead title="📊 Learning Progress" action="All courses" onAction={() => navigate('/courses')} bg="#EBF3FF" />
          {MOCK_ENROLLMENTS.map(e => (
            <div key={e.id} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 12.5 }}>{e.title}</div>
                  <div className="muted" style={{ fontSize: 11 }}>{e.provider}</div>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--blue)' }}>{e.progress}%</span>
              </div>
              <div style={{ height: 6, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: e.progress + '%', background: 'var(--blue)', borderRadius: 99 }} />
              </div>
            </div>
          ))}
        </div>

        {/* Row 3 — My Certificates */}
        <div className="card shadow">
          <SectionHead title="🎓 My Certificates" bg="#FEF6E4" />
          {MOCK_CERTS.map(c => (
            <div key={c.id} className="list-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 2, padding: '8px 0' }}>
              <span style={{ fontWeight: 600, fontSize: 13 }}>{c.title}</span>
              <span className="muted" style={{ fontSize: 11.5 }}>{c.issuer} · {c.date}</span>
            </div>
          ))}
        </div>

        {/* Row 3 — Skill Passport (spans 2 cols) */}
        <div className="card shadow" style={{ gridColumn: 'span 2', borderLeft: '3px solid var(--navy)' }}>
          <SectionHead title="🏆 Skill Passport" action="Edit profile" onAction={() => navigate('/profile')} bg="#E8EDF5" />
          {!user.first_name && !user.qualification ? (
            <p className="muted" style={{ fontSize: 12 }}>Complete your profile to build your Skill Passport.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {user.qualification && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: .4, marginBottom: 4 }}>Education</div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)' }}>{user.qualification}</span>
                </div>
              )}
              {user.skills?.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: .4, marginBottom: 6 }}>Skills</div>
                  <div className="chip-row">{user.skills.map(s => <span key={s} className="chip">{s}</span>)}</div>
                </div>
              )}
              {(user.preferred_sector || user.lang_english || user.lang_hindi) && (
                <div>
                  {user.preferred_sector && (
                    <>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: .4, marginBottom: 4 }}>Sector</div>
                      <span className="badge b-blue" style={{ marginBottom: 10, display: 'inline-block' }}>{user.preferred_sector}</span>
                    </>
                  )}
                  {(user.lang_english || user.lang_hindi || user.lang_regional) && (
                    <>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: .4, marginBottom: 6, marginTop: 8 }}>Languages</div>
                      <div className="chip-row">
                        {user.lang_english && <span className="chip">English · {user.lang_english}</span>}
                        {user.lang_hindi && <span className="chip">Hindi · {user.lang_hindi}</span>}
                        {user.lang_regional && <span className="chip">{user.lang_regional}</span>}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
