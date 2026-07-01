import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api.js';

export default function JobDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [applied, setApplied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.job(id).then(setJob).catch(() => {});
    if (user.role === 'candidate' || user.role === 'administrator') {
      api.myApplications().then(apps => setApplied(apps.some(a => a.job_id === Number(id)))).catch(() => {});
    }
  }, [id]);

  async function apply() {
    setBusy(true); setError('');
    try {
      await api.apply(Number(id));
      setApplied(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (!job) return <div className="page"><div className="empty">Loading job…</div></div>;

  return (
    <div className="page" style={{ maxWidth: 760 }}>
      <span className="muted" style={{ cursor: 'pointer', color: 'var(--blue)', fontWeight: 700 }} onClick={() => navigate('/jobs')}>← Back to jobs</span>
      <div className="card shadow" style={{ marginTop: 14 }}>
        <div className="row-between" style={{ alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--display)', fontSize: 22, color: 'var(--navy)' }}>{job.title}</h1>
            <p className="muted" style={{ marginTop: 6 }}>{job.employer_name} · {job.location || 'Remote'} · {job.job_type}</p>
          </div>
          <span className="badge b-blue">{job.status === 'open' ? 'Open' : 'Closed'}</span>
        </div>

        {(job.salary_min || job.salary_max) && (
          <div style={{ marginTop: 14, fontWeight: 700, color: 'var(--teal)' }}>
            ₹{job.salary_min?.toLocaleString()} – ₹{job.salary_max?.toLocaleString()} per year
          </div>
        )}

        <div className="section-title" style={{ marginTop: 22 }}>Description</div>
        <p style={{ color: 'var(--ink-2)', lineHeight: 1.6 }}>{job.description || 'No description provided.'}</p>

        <div className="section-title" style={{ marginTop: 22 }}>Required skills</div>
        <div className="chip-row">{job.required_skills.map(s => <span className="chip" key={s}>{s}</span>)}</div>

        {error && <div className="error-msg" style={{ marginTop: 18 }}>{error}</div>}

        {(user.role === 'candidate' || user.role === 'administrator') && (
          <button className="btn btn-primary" style={{ marginTop: 22 }} disabled={busy || applied} onClick={apply}>
            {applied ? 'Applied ✓' : busy ? 'Submitting…' : 'Apply now'}
          </button>
        )}
      </div>
    </div>
  );
}
