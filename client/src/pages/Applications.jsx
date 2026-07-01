import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api.js';

const statusColor = { applied: 'b-blue', shortlisted: 'b-gold', interview: 'b-gold', hired: 'b-teal', rejected: 'b-coral' };

export default function Applications() {
  const { user } = useAuth();
  const isAdmin = user.role === 'administrator';
  const [apps, setApps] = useState([]);

  function load() {
    if (isAdmin) {
      api.allApplications().then(setApps).catch(() => api.myApplications().then(setApps));
    } else {
      api.myApplications().then(setApps);
    }
  }
  useEffect(() => { load(); }, []);

  async function updateStatus(appId, status) {
    await api.updateApplicationStatus(appId, status);
    setApps(rows => rows.map(r => r.id === appId ? { ...r, status } : r));
  }

  async function deleteApp(appId) {
    if (!confirm('Delete this application?')) return;
    await api.deleteApplication(appId).catch(() => {});
    setApps(rows => rows.filter(r => r.id !== appId));
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>{isAdmin ? 'All Applications' : 'My Applications'}</h1>
        <p>{isAdmin ? 'View and manage all applications across the platform.' : 'Track the status of every role you\'ve applied to.'}</p>
      </div>
      {apps.length === 0 && <div className="empty"><i className="ti ti-file-text" />{isAdmin ? 'No applications found.' : 'You haven\'t applied to any jobs yet.'}</div>}
      {apps.map(a => (
        <div className="card shadow" key={a.id} style={{ marginBottom: 10 }}>
          <div className="row-between">
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{a.title}</div>
              <div className="muted">{a.employer_name} · {a.location || 'Remote'} · {a.job_type}</div>
              {isAdmin && a.candidate_name && <div className="muted" style={{ marginTop: 4 }}>Applicant: <strong>{a.candidate_name}</strong> · {a.email}</div>}
            </div>
            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
              {isAdmin ? (
                <>
                  <select value={a.status} onChange={e => updateStatus(a.id, e.target.value)} style={{ padding: '6px 8px', borderRadius: 8, border: '1.5px solid var(--border)' }}>
                    <option value="applied">Applied</option>
                    <option value="shortlisted">Shortlisted</option>
                    <option value="interview">Interview</option>
                    <option value="hired">Hired</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  <button className="btn btn-coral btn-sm" onClick={() => deleteApp(a.id)}>Delete</button>
                </>
              ) : (
                <>
                  <span className={'badge ' + (statusColor[a.status] || 'b-blue')}>{a.status}</span>
                  <div className="match-ring" style={{ justifyContent: 'flex-end', marginTop: 8 }}>
                    <div className="match-track"><div className="match-fill" style={{ width: `${a.match_score}%` }} /></div>
                    <span style={{ fontWeight: 700, color: 'var(--blue)', fontSize: 12 }}>{a.match_score}%</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
