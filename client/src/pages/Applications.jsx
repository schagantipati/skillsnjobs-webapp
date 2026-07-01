import { useEffect, useState } from 'react';
import { api } from '../api.js';

const statusColor = { applied: 'b-blue', shortlisted: 'b-gold', interview: 'b-gold', hired: 'b-teal', rejected: 'b-coral' };

export default function Applications() {
  const [apps, setApps] = useState([]);
  useEffect(() => { api.myApplications().then(setApps); }, []);

  return (
    <div className="page">
      <div className="page-header">
        <h1>My applications</h1>
        <p>Track the status of every role you've applied to.</p>
      </div>
      {apps.length === 0 && <div className="empty"><i className="ti ti-file-text" />You haven't applied to any jobs yet.</div>}
      {apps.map(a => (
        <div className="card shadow" key={a.id} style={{ marginBottom: 10 }}>
          <div className="row-between">
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{a.title}</div>
              <div className="muted">{a.employer_name} · {a.location || 'Remote'} · {a.job_type}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span className={'badge ' + (statusColor[a.status] || 'b-blue')}>{a.status}</span>
              <div className="match-ring" style={{ justifyContent: 'flex-end', marginTop: 8 }}>
                <div className="match-track"><div className="match-fill" style={{ width: `${a.match_score}%` }} /></div>
                <span style={{ fontWeight: 700, color: 'var(--blue)', fontSize: 12 }}>{a.match_score}%</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
