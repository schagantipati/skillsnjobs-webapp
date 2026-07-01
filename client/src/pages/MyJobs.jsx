import { useEffect, useState } from 'react';
import { api } from '../api.js';

const emptyForm = { title: '', description: '', skillsText: '', location: '', job_type: 'Full-time', salary_min: '', salary_max: '' };

export default function MyJobs() {
  const [jobs, setJobs] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [openJobId, setOpenJobId] = useState(null);
  const [applicants, setApplicants] = useState([]);

  function load() { api.myJobs().then(setJobs); }
  useEffect(() => { load(); }, []);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const required_skills = form.skillsText.split(',').map(s => s.trim()).filter(Boolean);
      await api.createJob({
        title: form.title, description: form.description, required_skills,
        location: form.location, job_type: form.job_type,
        salary_min: form.salary_min ? Number(form.salary_min) : null,
        salary_max: form.salary_max ? Number(form.salary_max) : null
      });
      setForm(emptyForm); setShowForm(false); load();
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }

  async function toggleClose(job) {
    await api.updateJob(job.id, { status: job.status === 'open' ? 'closed' : 'open' });
    load();
  }

  async function remove(job) {
    if (!confirm(`Delete posting "${job.title}"?`)) return;
    await api.deleteJob(job.id);
    load();
    if (openJobId === job.id) setOpenJobId(null);
  }

  async function viewApplicants(job) {
    if (openJobId === job.id) { setOpenJobId(null); return; }
    const rows = await api.jobApplicants(job.id);
    setApplicants(rows);
    setOpenJobId(job.id);
  }

  async function updateStatus(appId, status) {
    await api.updateApplicationStatus(appId, status);
    setApplicants(rows => rows.map(r => r.id === appId ? { ...r, status } : r));
  }

  return (
    <div className="page">
      <div className="row-between page-header">
        <div>
          <h1>My job postings</h1>
          <p>Create roles, review applicants and manage your hiring pipeline.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(s => !s)}>{showForm ? 'Cancel' : '+ Post a job'}</button>
      </div>

      {showForm && (
        <form className="card shadow" onSubmit={submit} style={{ marginBottom: 22 }}>
          {error && <div className="error-msg">{error}</div>}
          <div className="grid grid-2">
            <div className="field"><label>Job title</label><input value={form.title} onChange={e => set('title', e.target.value)} required /></div>
            <div className="field"><label>Location</label><input value={form.location} onChange={e => set('location', e.target.value)} placeholder="e.g. Bengaluru" /></div>
          </div>
          <div className="field"><label>Description</label><textarea value={form.description} onChange={e => set('description', e.target.value)} /></div>
          <div className="field"><label>Required skills (comma separated)</label><input value={form.skillsText} onChange={e => set('skillsText', e.target.value)} placeholder="e.g. SQL, Excel, Power BI" /></div>
          <div className="grid grid-3">
            <div className="field">
              <label>Job type</label>
              <select value={form.job_type} onChange={e => set('job_type', e.target.value)}>
                <option>Full-time</option><option>Part-time</option><option>Internship</option><option>Contract</option>
              </select>
            </div>
            <div className="field"><label>Salary min (₹/yr)</label><input type="number" value={form.salary_min} onChange={e => set('salary_min', e.target.value)} /></div>
            <div className="field"><label>Salary max (₹/yr)</label><input type="number" value={form.salary_max} onChange={e => set('salary_max', e.target.value)} /></div>
          </div>
          <button className="btn btn-primary" disabled={busy}>{busy ? 'Posting…' : 'Publish job'}</button>
        </form>
      )}

      {jobs.length === 0 && <div className="empty"><i className="ti ti-briefcase" />No job postings yet.</div>}

      {jobs.map(j => (
        <div className="card shadow" key={j.id} style={{ marginBottom: 12 }}>
          <div className="row-between">
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{j.title}</div>
              <div className="muted">{j.location || 'Remote'} · {j.job_type}</div>
            </div>
            <span className={'badge ' + (j.status === 'open' ? 'b-teal' : 'b-coral')}>{j.status}</span>
          </div>
          <div className="chip-row" style={{ margin: '10px 0' }}>{j.required_skills.map(s => <span className="chip" key={s}>{s}</span>)}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-outline btn-sm" onClick={() => viewApplicants(j)}>{openJobId === j.id ? 'Hide applicants' : 'View applicants'}</button>
            <button className="btn btn-outline btn-sm" onClick={() => toggleClose(j)}>{j.status === 'open' ? 'Close posting' : 'Reopen'}</button>
            <button className="btn btn-coral btn-sm" onClick={() => remove(j)}>Delete</button>
          </div>

          {openJobId === j.id && (
            <div style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 14 }}>
              {applicants.length === 0 && <div className="muted">No applicants yet.</div>}
              {applicants.map(a => (
                <div className="list-item" key={a.id}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{a.candidate_name}</div>
                    <div className="muted">{a.email} · {a.location || '—'} · {a.experience_years} yrs exp</div>
                    <div className="chip-row" style={{ marginTop: 6 }}>{a.skills.slice(0, 5).map(s => <span className="chip" key={s}>{s}</span>)}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="match-ring" style={{ justifyContent: 'flex-end', marginBottom: 8 }}>
                      <div className="match-track"><div className="match-fill" style={{ width: `${a.match_score}%` }} /></div>
                      <span style={{ fontWeight: 700, color: 'var(--blue)', fontSize: 12 }}>{a.match_score}%</span>
                    </div>
                    <select value={a.status} onChange={e => updateStatus(a.id, e.target.value)} style={{ padding: '6px 8px', borderRadius: 8, border: '1.5px solid var(--border)' }}>
                      <option value="applied">Applied</option>
                      <option value="shortlisted">Shortlisted</option>
                      <option value="interview">Interview</option>
                      <option value="hired">Hired</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
