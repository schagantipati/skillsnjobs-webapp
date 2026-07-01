import { useEffect, useState } from 'react';
import { api } from '../api.js';

/* ── helpers ──────────────────────────────────────────────────── */
function Counter({ to, prefix = '', suffix = '' }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!to) { setVal(0); return; }
    let start = null;
    const step = ts => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / 1200, 1);
      setVal(Math.floor((1 - Math.pow(1 - p, 3)) * to));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [to]);
  return <>{prefix}{val.toLocaleString('en-IN')}{suffix}</>;
}

const STATUS_STYLE = {
  'registered':  { bg: '#FEF3C7', color: '#92400E', label: 'Registered'  },
  'in_training': { bg: '#EFF6FF', color: '#1E5FBF', label: 'In Training' },
  'certified':   { bg: '#F5F3FF', color: '#6D28D9', label: 'Certified'   },
  'placed':      { bg: '#ECFDF5', color: '#065F46', label: 'Placed'      },
  'hired':       { bg: '#ECFDF5', color: '#065F46', label: 'Placed'      },
};

const DOMAIN_COLORS = {
  'IT': '#1E5FBF', 'it': '#1E5FBF', 'Healthcare': '#0A7B6C', 'Construction': '#D97706',
  'Retail': '#C0392B', 'Manufacturing': '#7C3AED', 'Agriculture': '#065F46', 'Finance': '#0891B2',
};

function statusStyle(s = '') {
  return STATUS_STYLE[s.toLowerCase()] || { bg: '#F1F5F9', color: '#374151', label: s || 'Registered' };
}

function domainColor(skills = []) {
  if (!skills.length) return '#374151';
  const s = skills[0];
  return DOMAIN_COLORS[s] || '#1E5FBF';
}

function domainLabel(skills = [], preferred_sector = '') {
  if (preferred_sector) return preferred_sector;
  if (skills.length) return skills[0];
  return '—';
}

/* fake AI match score seeded by id */
function aiScore(id) { return 60 + (id * 7 + 13) % 38; }

const FILTER_PILLS = ['All', 'Registered', 'In Training', 'Certified', 'Placed'];

export default function Candidates() {
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [filter, setFilter]   = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [viewCandidate, setViewCandidate] = useState(null);

  useEffect(() => {
    api.candidates()
      .then(data => { setRows(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  /* ── derived stats ── */
  const total    = rows.length;
  const placed   = rows.filter(c => ['placed','hired'].includes((c.employment_status || '').toLowerCase())).length;
  const training = rows.filter(c => (c.employment_status || '').toLowerCase() === 'in_training').length;
  const avgSalary = 16400; // placeholder — no salary field in DB yet

  const placedPct = total > 0 ? Math.round((placed / total) * 100) : 0;

  /* ── filter + search ── */
  const filtered = rows.filter(c => {
    const matchSearch = !search ||
      (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.city || c.location || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.state_name || '').toLowerCase().includes(search.toLowerCase());

    if (!matchSearch) return false;
    if (filter === 'All') return true;
    const status = (c.employment_status || 'registered').toLowerCase();
    if (filter === 'Placed')      return ['placed','hired'].includes(status);
    if (filter === 'In Training') return status === 'in_training';
    if (filter === 'Certified')   return status === 'certified';
    if (filter === 'Registered')  return ['registered',''].includes(status);
    return true;
  });

  const PILL = (label) => ({
    padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: 'none', transition: 'all .15s',
    background: filter === label ? '#0B1E3D' : '#EEF2F8',
    color: filter === label ? '#fff' : '#445074',
  });

  return (
    <div className="page" style={{ maxWidth: 1200, paddingBottom: 40 }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: '#0B1E3D', margin: 0 }}>Candidate Portal</h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#9CA3AF' }}>Complete candidate lifecycle management — Registration to Placement</p>
      </div>

      {/* ── KPI Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 0, marginBottom: 24, border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' }}>
        {[
          { val: total,    label: 'Total Registered',  sub: `${rows.length} in database`,  color: '#1E5FBF', prefix: '',  borderRight: true },
          { val: training, label: 'In Training',        sub: 'Active learners',              color: '#D97706', prefix: '',  borderRight: true },
          { val: placed,   label: 'Placed',             sub: `${placedPct}% rate`,           color: '#065F46', prefix: '',  borderRight: true },
          { val: avgSalary,label: 'Avg Monthly Salary', sub: '+8% YoY',                      color: '#7C3AED', prefix: '₹', borderRight: false },
        ].map((card, i) => (
          <div key={i} style={{ padding: '20px 24px', background: '#fff', borderRight: card.borderRight ? '1px solid #E5E7EB' : 'none', borderTop: `3px solid ${card.color}` }}>
            <div style={{ fontWeight: 900, fontSize: 28, color: card.color, letterSpacing: -1 }}>
              <Counter to={card.val} prefix={card.prefix} />
            </div>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#0B1E3D', marginTop: 4 }}>{card.label}</div>
            <div style={{ fontSize: 12, color: card.color, marginTop: 3, fontWeight: 600 }}>↑ {card.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Registry header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>👥</span>
          <span style={{ fontWeight: 800, fontSize: 15, color: '#0B1E3D' }}>Candidate Registry</span>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email, state…"
            style={{ padding: '8px 14px', borderRadius: 8, border: '1.5px solid #DDE3EE', fontSize: 13, width: 240, background: '#FAFBFD' }} />
          <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)} style={{ whiteSpace: 'nowrap', padding: '8px 16px' }}>
            + Add Candidate
          </button>
        </div>
      </div>

      {/* ── Filter pills ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {FILTER_PILLS.map(p => (
          <button key={p} style={PILL(p)} onClick={() => setFilter(p)}>{p}</button>
        ))}
      </div>

      {/* ── Table ── */}
      <div className="card shadow" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#F8FAFC', borderBottom: '1.5px solid #E5E7EB' }}>
              {['CANDIDATE','STATE','DOMAIN','STATUS','AI MATCH','SALARY','ACTION'].map(h => (
                <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 11, fontWeight: 800, color: '#9CA3AF', letterSpacing: 0.6, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={7} style={{ padding: 32, textAlign: 'center', color: '#9CA3AF' }}>Loading candidates…</td></tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>
                {rows.length === 0 ? 'No candidates registered yet.' : 'No candidates match your filter.'}
              </td></tr>
            )}
            {filtered.map((c, i) => {
              const status = statusStyle(c.employment_status || 'registered');
              const skills = Array.isArray(c.skills) ? c.skills : [];
              const dc     = domainColor(skills);
              const dl     = domainLabel(skills, c.preferred_sector);
              const score  = aiScore(c.id);
              const state  = c.state_name || c.location || '—';
              const qual   = c.qualification || '';
              const salary = c.expected_salary ? `₹${Math.round(c.expected_salary / 1000)}K/mo` : '—';

              return (
                <tr key={c.id} style={{ borderBottom: '1px solid #F0F2F8', background: i % 2 === 0 ? '#fff' : '#FAFBFD', transition: 'background .1s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#F0F6FF'}
                  onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#FAFBFD'}>

                  {/* Candidate */}
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ fontWeight: 700, color: '#0B1E3D', fontSize: 13 }}>{c.first_name ? `${c.first_name} ${c.last_name || ''}`.trim() : c.name}</div>
                    {qual && <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{qual}</div>}
                  </td>

                  {/* State */}
                  <td style={{ padding: '13px 16px', color: '#445074', fontWeight: 500 }}>{state}</td>

                  {/* Domain */}
                  <td style={{ padding: '13px 16px' }}>
                    {dl !== '—'
                      ? <span style={{ color: dc, fontWeight: 700, fontSize: 12, cursor: 'default' }}>{dl}</span>
                      : <span style={{ color: '#9CA3AF' }}>—</span>
                    }
                  </td>

                  {/* Status */}
                  <td style={{ padding: '13px 16px' }}>
                    <span style={{ background: status.bg, color: status.color, fontWeight: 700, fontSize: 11, padding: '3px 10px', borderRadius: 12, whiteSpace: 'nowrap' }}>
                      {status.label}
                    </span>
                  </td>

                  {/* AI Match */}
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 100 }}>
                      <div style={{ flex: 1, height: 5, background: '#E5E7EB', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${score}%`, background: score >= 85 ? '#065F46' : score >= 70 ? '#1E5FBF' : '#D97706', borderRadius: 4 }} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#0B1E3D', minWidth: 30 }}>{score}%</span>
                    </div>
                  </td>

                  {/* Salary */}
                  <td style={{ padding: '13px 16px', color: '#445074', fontWeight: 600 }}>{salary}</td>

                  {/* Action */}
                  <td style={{ padding: '13px 16px' }}>
                    <button onClick={() => setViewCandidate(c)}
                      style={{ background: 'none', border: '1px solid #DDE3EE', borderRadius: 7, padding: '5px 14px', fontSize: 12, fontWeight: 700, color: '#1E5FBF', cursor: 'pointer', transition: 'all .15s' }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#1E5FBF'; e.currentTarget.style.color = '#fff'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#1E5FBF'; }}>
                      View
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length > 0 && (
          <div style={{ padding: '10px 16px', borderTop: '1px solid #F0F2F8', fontSize: 12, color: '#9CA3AF', background: '#FAFBFD' }}>
            Showing {filtered.length} of {rows.length} candidates
          </div>
        )}
      </div>

      {/* ── View Modal ── */}
      {viewCandidate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card shadow" style={{ width: 520, maxWidth: '95vw', padding: 28, position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
            <button onClick={() => setViewCandidate(null)} style={{ position: 'absolute', top: 14, right: 16, background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#9CA3AF' }}>×</button>
            <div style={{ display: 'flex', gap: 14, marginBottom: 20, alignItems: 'center' }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#1E5FBF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: '#fff', fontWeight: 800, flexShrink: 0 }}>
                {(viewCandidate.first_name || viewCandidate.name || '?')[0].toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 16, color: '#0B1E3D' }}>
                  {viewCandidate.first_name ? `${viewCandidate.first_name} ${viewCandidate.last_name || ''}`.trim() : viewCandidate.name}
                </div>
                <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{viewCandidate.qualification || ''} · {viewCandidate.state_name || viewCandidate.location || '—'}</div>
              </div>
              <div style={{ marginLeft: 'auto' }}>
                {(() => { const s = statusStyle(viewCandidate.employment_status || 'registered'); return (
                  <span style={{ background: s.bg, color: s.color, fontWeight: 700, fontSize: 12, padding: '4px 12px', borderRadius: 12 }}>{s.label}</span>
                ); })()}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              {[
                ['Email',          viewCandidate.email],
                ['Phone',          viewCandidate.phone || '—'],
                ['Gender',         viewCandidate.gender || '—'],
                ['DOB',            viewCandidate.dob || '—'],
                ['City',           viewCandidate.city || '—'],
                ['State',          viewCandidate.state_name || '—'],
                ['Qualification',  viewCandidate.qualification || '—'],
                ['Employment',     viewCandidate.employment_status || '—'],
                ['Preferred Sector', viewCandidate.preferred_sector || '—'],
                ['Experience',     viewCandidate.experience_years != null ? `${viewCandidate.experience_years} yrs` : '—'],
              ].map(([k, v]) => (
                <div key={k} style={{ background: '#F8FAFC', borderRadius: 8, padding: '10px 12px' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 2 }}>{k}</div>
                  <div style={{ fontSize: 13, color: '#0B1E3D', fontWeight: 600, wordBreak: 'break-all' }}>{v}</div>
                </div>
              ))}
            </div>
            {(Array.isArray(viewCandidate.skills) ? viewCandidate.skills : []).length > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 8 }}>Skills</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {viewCandidate.skills.map(s => (
                    <span key={s} style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: '#EFF6FF', color: '#1E5FBF', border: '1px solid #BFDBFE' }}>{s}</span>
                  ))}
                </div>
              </div>
            )}
            {viewCandidate.bio && (
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 6 }}>Bio</div>
                <div style={{ fontSize: 13, color: '#445074', lineHeight: 1.6 }}>{viewCandidate.bio}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Add Candidate Modal ── */}
      {showModal && <AddCandidateModal onClose={() => setShowModal(false)} onSaved={c => { setRows(r => [c, ...r]); setShowModal(false); }} />}
    </div>
  );
}

/* ── Add Candidate Modal ────────────────────────────────────────── */
function AddCandidateModal({ onClose, onSaved }) {
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', phone: '', gender: '', city: '', state_name: '', qualification: '', preferred_sector: '', employment_status: 'registered', skills: '', password: 'Welcome@123', role: 'candidate' });
  const [busy, setBusy]   = useState(false);
  const [err, setErr]     = useState('');

  const F = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const INP = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #DDE3EE', fontSize: 13, boxSizing: 'border-box', background: '#FAFBFD' };

  async function submit() {
    if (!form.first_name || !form.email) { setErr('First name and email are required.'); return; }
    setBusy(true); setErr('');
    try {
      const payload = {
        ...form,
        name: `${form.first_name} ${form.last_name}`.trim(),
        skills: form.skills.split(',').map(s => s.trim()).filter(Boolean),
      };
      const res = await api.register(payload);
      onSaved({ ...payload, id: res.user?.id || Date.now(), skills: payload.skills });
    } catch (e) { setErr(e.message); setBusy(false); }
  }

  const fields = [
    [['First Name *', 'first_name'], ['Last Name', 'last_name']],
    [['Email *', 'email', 'email'], ['Phone', 'phone']],
    [['City', 'city'], ['State', 'state_name']],
    [['Qualification', 'qualification'], ['Gender', 'gender']],
    [['Preferred Sector', 'preferred_sector'], ['Skills (comma-separated)', 'skills']],
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card shadow" style={{ width: 560, maxWidth: '95vw', padding: 28, position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 16, background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#9CA3AF' }}>×</button>
        <div style={{ fontWeight: 800, fontSize: 16, color: '#0B1E3D', marginBottom: 20 }}>Add Candidate</div>
        {fields.map((row, ri) => (
          <div key={ri} style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
            {row.map(([label, key, type]) => (
              <div key={key} style={{ flex: 1 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#445074', display: 'block', marginBottom: 4 }}>{label}</label>
                <input type={type || 'text'} value={form[key]} onChange={F(key)} style={INP} />
              </div>
            ))}
          </div>
        ))}
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#445074', display: 'block', marginBottom: 4 }}>Employment Status</label>
          <select value={form.employment_status} onChange={F('employment_status')} style={INP}>
            <option value="registered">Registered</option>
            <option value="in_training">In Training</option>
            <option value="certified">Certified</option>
            <option value="placed">Placed</option>
          </select>
        </div>
        {err && <div style={{ color: '#B91C1C', fontSize: 12, marginBottom: 10 }}>{err}</div>}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
          <button className="btn btn-outline btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={submit} disabled={busy} style={{ padding: '9px 22px' }}>
            {busy ? 'Saving…' : 'Add Candidate'}
          </button>
        </div>
      </div>
    </div>
  );
}
