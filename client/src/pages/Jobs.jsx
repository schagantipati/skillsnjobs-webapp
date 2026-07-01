import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api.js';

export default function Jobs() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [q, setQ] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(true);

  function load(params = {}) {
    setLoading(true);
    api.jobs(params).then(setJobs).finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, []);

  function search(e) {
    e.preventDefault();
    const params = {};
    if (q) params.q = q;
    if (location) params.location = location;
    load(params);
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Job opportunities</h1>
        <p>{user.role === 'candidate' ? 'Ranked by how well your skills match each role.' : 'Browse all open roles on the platform.'}</p>
      </div>

      <form className="card" onSubmit={search} style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
        <input style={{ flex: 2, minWidth: 200, padding: '10px 12px', border: '1.5px solid var(--border)', borderRadius: 9 }} placeholder="Search title or description…" value={q} onChange={e => setQ(e.target.value)} />
        <input style={{ flex: 1, minWidth: 140, padding: '10px 12px', border: '1.5px solid var(--border)', borderRadius: 9 }} placeholder="Location" value={location} onChange={e => setLocation(e.target.value)} />
        <button className="btn btn-primary">Search</button>
      </form>

      {loading && <div className="empty">Loading jobs…</div>}
      {!loading && jobs.length === 0 && <div className="empty"><i className="ti ti-briefcase" />No jobs match your search.</div>}

      <div className="grid grid-2">
        {jobs.map(j => (
          <div className="card shadow" key={j.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/jobs/${j.id}`)}>
            <div className="row-between" style={{ alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{j.title}</div>
                <div className="muted">{j.employer_name} · {j.location || 'Remote'} · {j.job_type}</div>
              </div>
              {typeof j.match_score === 'number' && (
                <div className="match-ring">
                  <div className="match-track"><div className="match-fill" style={{ width: `${j.match_score}%` }} /></div>
                  <span style={{ fontWeight: 700, color: 'var(--blue)', fontSize: 12 }}>{j.match_score}%</span>
                </div>
              )}
            </div>
            <p className="muted" style={{ margin: '10px 0' }}>{(j.description || '').slice(0, 120)}{j.description && j.description.length > 120 ? '…' : ''}</p>
            <div className="chip-row">
              {j.required_skills.slice(0, 5).map(s => <span className="chip" key={s}>{s}</span>)}
            </div>
            {(j.salary_min || j.salary_max) && (
              <div className="muted" style={{ marginTop: 10, fontWeight: 700 }}>
                ₹{j.salary_min?.toLocaleString()} – ₹{j.salary_max?.toLocaleString()} / yr
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
