import { useEffect, useState } from 'react';
import { api } from '../api.js';

export default function Candidates() {
  const [candidates, setCandidates] = useState([]);
  useEffect(() => { api.candidates().then(setCandidates); }, []);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Candidate pool</h1>
        <p>Browse registered candidates and their skill profiles.</p>
      </div>
      {candidates.length === 0 && <div className="empty"><i className="ti ti-users" />No candidates registered yet.</div>}
      <div className="grid grid-3">
        {candidates.map(c => (
          <div className="card shadow" key={c.id}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{c.name}</div>
            <div className="muted" style={{ marginBottom: 10 }}>{c.location || '—'} · {c.experience_years} yrs exp</div>
            <div className="chip-row">{c.skills.map(s => <span className="chip" key={s}>{s}</span>)}</div>
            {c.bio && <p className="muted" style={{ marginTop: 10 }}>{c.bio}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
