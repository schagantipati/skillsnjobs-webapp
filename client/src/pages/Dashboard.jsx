import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api.js';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [recs, setRecs] = useState(null);

  useEffect(() => {
    api.stats().then(setStats).catch(() => {});
    api.jobs().then(rows => setJobs(rows.slice(0, 4))).catch(() => {});
    if (user.role === 'candidate') {
      api.recommendations().then(setRecs).catch(() => {});
    }
  }, [user.role]);

  const kpis = (() => {
    if (!stats) return [];
    if (user.role === 'candidate') return [
      { label: 'Open jobs', val: stats.openJobs },
      { label: 'My applications', val: stats.myApplications ?? 0 },
      { label: 'My enrollments', val: stats.myEnrollments ?? 0 },
      { label: 'Courses available', val: stats.courses }
    ];
    if (user.role === 'employer') return [
      { label: 'My job postings', val: stats.myJobs ?? 0 },
      { label: 'Applicants received', val: stats.myApplicants ?? 0 },
      { label: 'Candidates on platform', val: stats.candidates },
      { label: 'Hired (platform-wide)', val: stats.hired }
    ];
    return [
      { label: 'Open jobs', val: stats.openJobs },
      { label: 'Candidates', val: stats.candidates },
      { label: 'Employers', val: stats.employers },
      { label: 'Courses', val: stats.courses }
    ];
  })();

  return (
    <div className="page">
      <div className="page-header">
        <h1>Welcome back, {user.name.split(' ')[0]} 👋</h1>
        <p>Here's what's happening on SkillsNJobs today.</p>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 22 }}>
        {kpis.map(k => (
          <div className="kpi" key={k.label}>
            <div className="val">{k.val}</div>
            <div className="lbl">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-2">
        <div className="card shadow">
          <div className="row-between" style={{ marginBottom: 12 }}>
            <div className="section-title" style={{ marginBottom: 0 }}>
              {user.role === 'candidate' ? 'Top matching jobs' : 'Recently posted jobs'}
            </div>
            <span className="muted" style={{ color: 'var(--blue)', cursor: 'pointer', fontWeight: 700 }} onClick={() => navigate('/jobs')}>View all →</span>
          </div>
          {jobs.length === 0 && <div className="empty">No jobs yet.</div>}
          {jobs.map(j => (
            <div className="list-item" key={j.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/jobs/${j.id}`)}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13.5 }}>{j.title}</div>
                <div className="muted">{j.employer_name} · {j.location || 'Remote'}</div>
              </div>
              {typeof j.match_score === 'number' && (
                <div className="match-ring">
                  <div className="match-track"><div className="match-fill" style={{ width: `${j.match_score}%` }} /></div>
                  <span style={{ fontWeight: 700, color: 'var(--blue)', fontSize: 12 }}>{j.match_score}%</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {user.role === 'candidate' ? (
          <div className="card shadow">
            <div className="section-title">Skill gaps to close</div>
            {!recs && <div className="muted">Loading recommendations…</div>}
            {recs && recs.topSkillGaps.length === 0 && <div className="empty">You're matched on every open role's required skills. 🎉</div>}
            {recs && recs.topSkillGaps.length > 0 && (
              <>
                <div className="chip-row" style={{ marginBottom: 14 }}>
                  {recs.topSkillGaps.map(s => <span className="chip missing" key={s}>{s}</span>)}
                </div>
                <div className="muted" style={{ marginBottom: 8, fontWeight: 700 }}>Recommended courses</div>
                {recs.recommendedCourses.slice(0, 3).map(c => (
                  <div className="list-item" key={c.id}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{c.title}</div>
                      <div className="muted">{c.provider} · {c.duration_weeks} wks</div>
                    </div>
                    <span className="badge b-teal">closes {c.relevance} gap{c.relevance > 1 ? 's' : ''}</span>
                  </div>
                ))}
              </>
            )}
          </div>
        ) : (
          <div className="card shadow">
            <div className="section-title">Quick actions</div>
            {(user.role === 'employer' || user.role === 'admin') && (
              <button className="btn btn-primary btn-block" style={{ marginBottom: 10 }} onClick={() => navigate('/my-jobs')}>Post a new job</button>
            )}
            <button className="btn btn-outline btn-block" style={{ marginBottom: 10 }} onClick={() => navigate('/candidates')}>Browse candidates</button>
            <button className="btn btn-outline btn-block" onClick={() => navigate('/courses')}>Explore courses</button>
          </div>
        )}
      </div>
    </div>
  );
}
