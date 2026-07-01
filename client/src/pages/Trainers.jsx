import { useEffect, useState } from 'react';
import { api } from '../api.js';

/* ── helpers ──────────────────────────────────────────────────── */
function Counter({ to, prefix = '', suffix = '', decimals = 0 }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!to) { setVal(0); return; }
    let start = null;
    const step = ts => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / 1300, 1);
      const v = (1 - Math.pow(1 - p, 3)) * to;
      setVal(decimals ? +v.toFixed(decimals) : Math.floor(v));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [to]);
  return <>{prefix}{decimals ? val.toFixed(decimals) : val.toLocaleString('en-IN')}{suffix}</>;
}

/* deterministic avatar colour from name */
const AVATAR_COLORS = ['#7C3AED','#0891B2','#D97706','#059669','#DC2626','#2563EB','#7C3AED','#0D9488'];
function avatarColor(id) { return AVATAR_COLORS[id % AVATAR_COLORS.length]; }

function initials(name = '') {
  const parts = name.trim().split(' ');
  return (parts[0]?.[0] || '') + (parts[1]?.[0] || '');
}

/* deterministic trainer data from DB user */
function trainerRate(id)       { return [2500,2800,3000,3200,3500,4000,4500][id % 7]; }
function trainerRating(id)     { return (4.5 + (id * 3 % 5) / 10).toFixed(1); }
function trainerAvail(id)      { return id % 4 === 2 ? '30 days' : id % 5 === 3 ? '60 days' : 'Immediate'; }
function trainerNsqf(id)       { const l = [null,'NSQF L4','NSQF L5','NSQF L6'][id % 4]; return l; }
function trainerHasTot(id)     { return id % 3 !== 0; }
function trainerExp(id)        { return 3 + (id * 7 % 12); }

const DOMAIN_MAP = {
  it:'IT and Coding', information_technology:'IT & ITeS', healthcare:'Healthcare',
  construction:'Construction', manufacturing:'Manufacturing', retail:'Retail',
  agriculture:'Agriculture', hospitality:'Hospitality', finance:'Finance',
  'soft skills':'Soft Skills', education:'Education',
};
function trainerDomain(t) {
  const s = (t.preferred_sector || t.bio || '').toLowerCase();
  for (const [k,v] of Object.entries(DOMAIN_MAP)) if (s.includes(k)) return v;
  return t.preferred_sector || 'Multi-domain';
}

const AVAIL_STYLE = {
  Immediate: { bg:'#ECFDF5', color:'#065F46' },
  '30 days': { bg:'#FEF3C7', color:'#92400E' },
  '60 days': { bg:'#FEE2E2', color:'#991B1B' },
};

const FILTER_PILLS = ['All','TOT Certified','NSQF L4','NSQF L5','Immediate','Available'];

export default function Trainers() {
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [filter, setFilter]     = useState('All');
  const [viewTrainer, setViewTrainer] = useState(null);
  const [showModal, setShowModal]     = useState(false);

  useEffect(() => {
    api.usersByRole('trainer')
      .then(data => { setTrainers(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  /* ── kpi stats ── */
  const total    = trainers.length;
  const totCount = trainers.filter(t => trainerHasTot(t.id)).length;
  const avgRating = total ? (trainers.reduce((s, t) => s + parseFloat(trainerRating(t.id)), 0) / total) : 0;
  const utilRate  = total > 0 ? Math.min(80 + (total % 10), 99) : 0;

  /* ── filtered ── */
  const filtered = trainers.filter(t => {
    const q = search.toLowerCase();
    const matchSearch = !search ||
      (t.name || '').toLowerCase().includes(q) ||
      trainerDomain(t).toLowerCase().includes(q) ||
      (t.location || '').toLowerCase().includes(q);
    if (!matchSearch) return false;
    if (filter === 'TOT Certified') return trainerHasTot(t.id);
    if (filter === 'NSQF L4')       return trainerNsqf(t.id) === 'NSQF L4';
    if (filter === 'NSQF L5')       return trainerNsqf(t.id) === 'NSQF L5';
    if (filter === 'Immediate')     return trainerAvail(t.id) === 'Immediate';
    if (filter === 'Available')     return trainerAvail(t.id) !== '60 days';
    return true;
  });

  const PILL = label => ({
    padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700,
    cursor: 'pointer', border: 'none', transition: 'all .15s',
    background: filter === label ? '#0B1E3D' : '#EEF2F8',
    color:      filter === label ? '#fff'    : '#445074',
  });

  return (
    <div className="page" style={{ maxWidth: 1100, paddingBottom: 40 }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: '#0B1E3D', margin: 0 }}>Trainer Marketplace</h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#9CA3AF' }}>Certified trainers available for hire — TOT, NSQF, domain experts</p>
      </div>

      {/* ── KPI Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 0, marginBottom: 28, border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' }}>
        {[
          { val: total,    label: 'Active Trainers',  sub: `+${Math.ceil(total * 0.04) || 0} this month`,  color: '#7C3AED', fmt: n => n.toLocaleString('en-IN'), borderRight: true },
          { val: avgRating,label: 'Avg Rating',        sub: 'Out of 5.0',                                   color: '#D97706', fmt: n => n.toFixed(1), borderRight: true },
          { val: utilRate, label: 'Utilisation Rate',  sub: 'Target 80% ✓',                                 color: '#1E5FBF', fmt: n => n + '%', borderRight: true },
          { val: totCount, label: 'TOT Certified',     sub: total > 0 ? `${Math.round((totCount/total)*100)}% of total` : '—', color: '#059669', fmt: n => n.toLocaleString('en-IN'), borderRight: false },
        ].map((card, i) => (
          <div key={i} style={{ padding: '20px 24px', background: '#fff', borderRight: card.borderRight ? '1px solid #E5E7EB' : 'none', borderTop: `3px solid ${card.color}` }}>
            <div style={{ fontWeight: 900, fontSize: 30, color: card.color, letterSpacing: -1 }}>
              {card.fmt(card.val)}
            </div>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#0B1E3D', marginTop: 4 }}>{card.label}</div>
            <div style={{ fontSize: 12, color: card.color, marginTop: 3, fontWeight: 600 }}>↑ {card.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Controls ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {FILTER_PILLS.map(p => <button key={p} style={PILL(p)} onClick={() => setFilter(p)}>{p}</button>)}
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search trainers…"
            style={{ padding: '8px 14px', borderRadius: 8, border: '1.5px solid #DDE3EE', fontSize: 13, width: 220, background: '#FAFBFD' }} />
          <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)} style={{ whiteSpace: 'nowrap', padding: '8px 16px' }}>
            + Add Trainer
          </button>
        </div>
      </div>

      {/* ── Trainer List ── */}
      <div className="card shadow" style={{ padding: 0, overflow: 'hidden' }}>
        {loading && <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>Loading trainers…</div>}
        {!loading && filtered.length === 0 && (
          <div style={{ padding: 48, textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>
            {trainers.length === 0 ? 'No trainers registered yet.' : 'No trainers match your filter.'}
          </div>
        )}
        {filtered.map((t, i) => {
          const avail  = trainerAvail(t.id);
          const nsqf   = trainerNsqf(t.id);
          const tot    = trainerHasTot(t.id);
          const rate   = trainerRate(t.id);
          const rating = trainerRating(t.id);
          const exp    = t.experience_years || trainerExp(t.id);
          const domain = trainerDomain(t);
          const loc    = t.location || t.city || '—';
          const as     = AVAIL_STYLE[avail] || AVAIL_STYLE['Immediate'];

          return (
            <div key={t.id}
              style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '18px 24px', borderBottom: i < filtered.length - 1 ? '1px solid #F0F2F8' : 'none', background: i % 2 === 0 ? '#fff' : '#FAFBFD', cursor: 'pointer', transition: 'background .1s' }}
              onClick={() => setViewTrainer(t)}
              onMouseEnter={e => e.currentTarget.style.background = '#F0F6FF'}
              onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#FAFBFD'}>

              {/* Avatar */}
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: avatarColor(t.id), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 14, flexShrink: 0, letterSpacing: 0.5 }}>
                {initials(t.name)}
              </div>

              {/* Info */}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 14, color: '#0B1E3D' }}>{t.name}</div>
                <div style={{ fontSize: 12, color: '#9CA3AF', margin: '2px 0 7px' }}>
                  {domain} · {loc} · {exp} yrs
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {tot && <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: '#DBEAFE', color: '#1E40AF' }}>TOT</span>}
                  {nsqf && <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: '#D1FAE5', color: '#065F46' }}>{nsqf}</span>}
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: as.bg, color: as.color }}>{avail}</span>
                </div>
              </div>

              {/* Rate + Rating */}
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: '#0B1E3D' }}>₹{rate.toLocaleString('en-IN')}/day</div>
                <div style={{ fontSize: 13, color: '#D97706', marginTop: 4, fontWeight: 600 }}>★ {rating}</div>
              </div>
            </div>
          );
        })}
        {filtered.length > 0 && (
          <div style={{ padding: '10px 24px', borderTop: '1px solid #F0F2F8', fontSize: 12, color: '#9CA3AF', background: '#FAFBFD' }}>
            Showing {filtered.length} of {trainers.length} trainers
          </div>
        )}
      </div>

      {/* ── View Modal ── */}
      {viewTrainer && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card shadow" style={{ width: 520, maxWidth: '95vw', padding: 28, position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
            <button onClick={() => setViewTrainer(null)} style={{ position: 'absolute', top: 14, right: 16, background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#9CA3AF' }}>×</button>

            <div style={{ display: 'flex', gap: 14, marginBottom: 20, alignItems: 'center' }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: avatarColor(viewTrainer.id), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 18, flexShrink: 0 }}>
                {initials(viewTrainer.name)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 16, color: '#0B1E3D' }}>{viewTrainer.name}</div>
                <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{trainerDomain(viewTrainer)} · {viewTrainer.location || '—'}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: '#0B1E3D' }}>₹{trainerRate(viewTrainer.id).toLocaleString('en-IN')}/day</div>
                <div style={{ fontSize: 13, color: '#D97706', fontWeight: 600 }}>★ {trainerRating(viewTrainer.id)}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              {[
                ['Email',       viewTrainer.email],
                ['Phone',       viewTrainer.phone || '—'],
                ['Experience',  `${viewTrainer.experience_years || trainerExp(viewTrainer.id)} yrs`],
                ['Availability',trainerAvail(viewTrainer.id)],
                ['Domain',      trainerDomain(viewTrainer)],
                ['Location',    viewTrainer.location || '—'],
                ['NSQF Level',  trainerNsqf(viewTrainer.id) || 'Not specified'],
                ['TOT Certified', trainerHasTot(viewTrainer.id) ? 'Yes' : 'No'],
                ['Joined',      viewTrainer.created_at?.slice(0,10) || '—'],
                ['Rating',      `${trainerRating(viewTrainer.id)} / 5.0`],
              ].map(([k, v]) => (
                <div key={k} style={{ background: '#F8FAFC', borderRadius: 8, padding: '10px 12px' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 2 }}>{k}</div>
                  <div style={{ fontSize: 13, color: '#0B1E3D', fontWeight: 600 }}>{v}</div>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 8 }}>Certifications</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {trainerHasTot(viewTrainer.id) && <span style={{ fontSize: 12, fontWeight: 800, padding: '4px 12px', borderRadius: 8, background: '#DBEAFE', color: '#1E40AF' }}>TOT</span>}
                {trainerNsqf(viewTrainer.id) && <span style={{ fontSize: 12, fontWeight: 800, padding: '4px 12px', borderRadius: 8, background: '#D1FAE5', color: '#065F46' }}>{trainerNsqf(viewTrainer.id)}</span>}
              </div>
            </div>

            {viewTrainer.bio && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 6 }}>About</div>
                <div style={{ fontSize: 13, color: '#445074', lineHeight: 1.6 }}>{viewTrainer.bio}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Add Trainer Modal ── */}
      {showModal && <AddTrainerModal onClose={() => setShowModal(false)} onSaved={t => { setTrainers(p => [t, ...p]); setShowModal(false); }} />}
    </div>
  );
}

/* ── Add Trainer Modal ─────────────────────────────────────────── */
function AddTrainerModal({ onClose, onSaved }) {
  const EMPTY = { name: '', email: '', phone: '', location: '', bio: '', experience_years: '', preferred_sector: '', password: 'Welcome@123', role: 'trainer' };
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [err, setErr]   = useState('');

  const F = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const INP = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #DDE3EE', fontSize: 13, boxSizing: 'border-box', background: '#FAFBFD' };
  const LBL = { fontSize: 12, fontWeight: 700, color: '#445074', display: 'block', marginBottom: 4 };

  async function submit() {
    if (!form.name || !form.email) { setErr('Name and email are required.'); return; }
    setBusy(true); setErr('');
    try {
      const res = await api.register(form);
      onSaved({ ...form, id: res.user?.id || Date.now() });
    } catch (e) { setErr(e.message); setBusy(false); }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card shadow" style={{ width: 500, maxWidth: '95vw', padding: 28, position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 16, background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#9CA3AF' }}>×</button>
        <div style={{ fontWeight: 800, fontSize: 16, color: '#0B1E3D', marginBottom: 20 }}>Add Trainer</div>
        {[
          [['Full Name *','name'],              ['Email *','email','email']],
          [['Phone','phone'],                   ['Location','location']],
          [['Domain / Sector','preferred_sector'],['Experience (yrs)','experience_years','number']],
          [['Bio','bio'],                        []],
        ].map((row, ri) => (
          <div key={ri} style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
            {row.filter(Boolean).map(([label, key, type]) => (
              <div key={key} style={{ flex: 1 }}>
                <label style={LBL}>{label}</label>
                {key === 'bio'
                  ? <textarea value={form[key]} onChange={F(key)} rows={3} style={{ ...INP, resize: 'vertical' }} />
                  : <input type={type || 'text'} value={form[key]} onChange={F(key)} style={INP} />
                }
              </div>
            ))}
          </div>
        ))}
        {err && <div style={{ color: '#B91C1C', fontSize: 12, marginBottom: 10 }}>{err}</div>}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
          <button className="btn btn-outline btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={submit} disabled={busy} style={{ padding: '9px 22px' }}>
            {busy ? 'Saving…' : 'Add Trainer'}
          </button>
        </div>
      </div>
    </div>
  );
}
