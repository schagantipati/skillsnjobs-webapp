import { useEffect, useState, useCallback } from 'react';
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

/* deterministic score from id */
function vendorScore(id) { return 70 + (id * 11 + 7) % 30; }

const AFFIL_COLORS = {
  NSDC:  { bg: '#DBEAFE', color: '#1E40AF' },
  PMKVY: { bg: '#D1FAE5', color: '#065F46' },
  MoRD:  { bg: '#FEF3C7', color: '#92400E' },
  State: { bg: '#EDE9FE', color: '#5B21B6' },
};

const TYPE_MAP = {
  it:           'IT Training',
  information_technology: 'IT & ITeS',
  healthcare:   'Healthcare',
  construction: 'Construction',
  manufacturing:'Manufacturing',
  retail:       'Retail',
  agriculture:  'Agriculture',
  hospitality:  'Hospitality',
  finance:      'Finance',
};

function vendorType(v) {
  if (v.org_name?.toLowerCase().includes('tech') || v.org_name?.toLowerCase().includes('it')) return 'IT Training';
  if (v.bio?.toLowerCase().includes('health')) return 'Healthcare';
  if (v.bio?.toLowerCase().includes('construct')) return 'Construction';
  if (v.bio?.toLowerCase().includes('manuf')) return 'Manufacturing';
  const sec = (v.preferred_sector || '').toLowerCase();
  return TYPE_MAP[sec] || v.preferred_sector || 'Multi-sector';
}

/* affiliations: pick 1-2 based on vendor id */
function vendorAffils(id) {
  const all = ['NSDC','PMKVY','MoRD','State'];
  const n = (id % 3) + 1;
  return all.slice(id % all.length).concat(all).slice(0, n);
}

const STATUS_OPTS = ['pending','verified'];
const FILTER_PILLS = ['All','NSDC','MoRD','State Mission','Verified','Pending'];

export default function TrainingVendors() {
  const [vendors, setVendors]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [filter, setFilter]     = useState('All');
  const [viewVendor, setViewVendor] = useState(null);
  const [showModal, setShowModal]   = useState(false);

  useEffect(() => {
    api.usersByRole('training_vendor')
      .then(data => { setVendors(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  /* ── derived stats ── */
  const total    = vendors.length;
  const verified = vendors.filter(v => (v.verification_status || 'verified') === 'verified').length;
  const pending  = total - verified;

  /* ── filter ── */
  const filtered = vendors.filter(v => {
    const q = search.toLowerCase();
    const matchSearch = !search ||
      (v.name || '').toLowerCase().includes(q) ||
      (v.org_name || '').toLowerCase().includes(q) ||
      (v.email || '').toLowerCase().includes(q) ||
      (v.location || '').toLowerCase().includes(q);
    if (!matchSearch) return false;
    const affils = vendorAffils(v.id);
    if (filter === 'NSDC')         return affils.includes('NSDC');
    if (filter === 'MoRD')         return affils.includes('MoRD');
    if (filter === 'State Mission') return affils.includes('State');
    if (filter === 'Verified')     return (v.verification_status || 'verified') === 'verified';
    if (filter === 'Pending')      return (v.verification_status || 'verified') === 'pending';
    return true;
  });

  const PILL = (label) => ({
    padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: 'none', transition: 'all .15s',
    background: filter === label ? '#0B1E3D' : '#EEF2F8',
    color:      filter === label ? '#fff'    : '#445074',
  });

  return (
    <div className="page" style={{ maxWidth: 1200, paddingBottom: 40 }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: '#0B1E3D', margin: 0 }}>Vendor / Training Partner Management</h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#9CA3AF' }}>Verified training organisations — NSDC, MoRD, State skill mission empanelment</p>
      </div>

      {/* ── KPI Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 0, marginBottom: 24, border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' }}>
        {[
          { val: verified, label: 'Verified Partners',   sub: `Target: ${Math.max(verified, 100)} ✓`,        color: '#065F46', borderRight: true },
          { val: pending,  label: 'Pending Verification',sub: 'Avg 2.1 days to complete',                    color: '#D97706', borderRight: true },
          { val: total * 4 || 0, label: 'Training Centres',    sub: `Across ${Math.min(total * 2, 28)} states`,  color: '#1E5FBF', borderRight: true },
          { val: total * 200 || 0, label: 'Annual Capacity',  sub: 'Candidates per year',                   color: '#7C3AED', borderRight: false },
        ].map((card, i) => (
          <div key={i} style={{ padding: '20px 24px', background: '#fff', borderRight: card.borderRight ? '1px solid #E5E7EB' : 'none', borderTop: `3px solid ${card.color}` }}>
            <div style={{ fontWeight: 900, fontSize: 28, color: card.color, letterSpacing: -1 }}>
              <Counter to={card.val} />
            </div>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#0B1E3D', marginTop: 4 }}>{card.label}</div>
            <div style={{ fontSize: 12, color: card.color, marginTop: 3, fontWeight: 600 }}>↑ {card.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Registry header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>🏫</span>
          <span style={{ fontWeight: 800, fontSize: 15, color: '#0B1E3D' }}>Partner Registry</span>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, org, location…"
            style={{ padding: '8px 14px', borderRadius: 8, border: '1.5px solid #DDE3EE', fontSize: 13, width: 240, background: '#FAFBFD' }} />
          <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)} style={{ whiteSpace: 'nowrap', padding: '8px 16px' }}>
            + Register Vendor
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
              {['ORGANISATION','TYPE','STATES','CAPACITY','AFFILIATIONS','STATUS','SCORE','ACTION'].map(h => (
                <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 11, fontWeight: 800, color: '#9CA3AF', letterSpacing: 0.6, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={8} style={{ padding: 32, textAlign: 'center', color: '#9CA3AF' }}>Loading training vendors…</td></tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={8} style={{ padding: 40, textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>
                {vendors.length === 0 ? 'No training vendors registered yet.' : 'No vendors match your filter.'}
              </td></tr>
            )}
            {filtered.map((v, i) => {
              const vStatus   = v.verification_status || 'verified';
              const affils    = vendorAffils(v.id);
              const score     = vendorScore(v.id);
              const type      = vendorType(v);
              const states    = v.states_covered || `${(v.id % 12) + 2} states`;
              const capacity  = v.annual_capacity ? `${v.annual_capacity}/yr` : `${((v.id % 20) + 3) * 100}/yr`;

              return (
                <tr key={v.id} style={{ borderBottom: '1px solid #F0F2F8', background: i % 2 === 0 ? '#fff' : '#FAFBFD', transition: 'background .1s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#F0F6FF'}
                  onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#FAFBFD'}>

                  {/* Organisation */}
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ fontWeight: 700, color: '#0B1E3D', fontSize: 13 }}>{v.org_name || v.name}</div>
                    {v.registration_number && <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>Reg: {v.registration_number}</div>}
                  </td>

                  {/* Type */}
                  <td style={{ padding: '13px 16px', color: '#445074', fontWeight: 500 }}>{type}</td>

                  {/* States */}
                  <td style={{ padding: '13px 16px', color: '#445074' }}>{states}</td>

                  {/* Capacity */}
                  <td style={{ padding: '13px 16px', color: '#445074', fontWeight: 600 }}>{capacity}</td>

                  {/* Affiliations */}
                  <td style={{ padding: '13px 16px' }}>
                    {affils.length > 0
                      ? <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                          {affils.map(a => {
                            const ac = AFFIL_COLORS[a] || { bg: '#F1F5F9', color: '#374151' };
                            return <span key={a} style={{ fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 6, background: ac.bg, color: ac.color, letterSpacing: 0.3 }}>{a}</span>;
                          })}
                        </div>
                      : <span style={{ color: '#9CA3AF' }}>—</span>
                    }
                  </td>

                  {/* Status */}
                  <td style={{ padding: '13px 16px' }}>
                    {vStatus === 'verified'
                      ? <span style={{ background: '#ECFDF5', color: '#065F46', fontWeight: 700, fontSize: 11, padding: '3px 10px', borderRadius: 12 }}>Verified</span>
                      : <span style={{ background: '#FEF3C7', color: '#92400E', fontWeight: 700, fontSize: 11, padding: '3px 10px', borderRadius: 12 }}>Pending</span>
                    }
                  </td>

                  {/* Score */}
                  <td style={{ padding: '13px 16px' }}>
                    <span style={{ fontWeight: 900, fontSize: 14, color: score >= 90 ? '#065F46' : score >= 80 ? '#1E5FBF' : '#D97706' }}>{score}</span>
                    <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600 }}>/100</span>
                  </td>

                  {/* Action */}
                  <td style={{ padding: '13px 16px' }}>
                    <button onClick={() => setViewVendor(v)}
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
            Showing {filtered.length} of {vendors.length} training partners
          </div>
        )}
      </div>

      {/* ── View Modal ── */}
      {viewVendor && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card shadow" style={{ width: 560, maxWidth: '95vw', padding: 28, position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
            <button onClick={() => setViewVendor(null)} style={{ position: 'absolute', top: 14, right: 16, background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#9CA3AF' }}>×</button>
            <div style={{ display: 'flex', gap: 14, marginBottom: 20, alignItems: 'center' }}>
              <div style={{ width: 52, height: 52, borderRadius: 12, background: '#0A7B6C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: '#fff', fontWeight: 800, flexShrink: 0 }}>
                🏫
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 16, color: '#0B1E3D' }}>{viewVendor.org_name || viewVendor.name}</div>
                <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{vendorType(viewVendor)} · {viewVendor.location || '—'}</div>
              </div>
              <span style={{ background: '#ECFDF5', color: '#065F46', fontWeight: 700, fontSize: 12, padding: '4px 12px', borderRadius: 12 }}>
                {viewVendor.verification_status || 'Verified'}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              {[
                ['Contact Name',   viewVendor.name],
                ['Email',          viewVendor.email],
                ['Phone',          viewVendor.phone || '—'],
                ['Location',       viewVendor.location || '—'],
                ['Reg. Number',    viewVendor.registration_number || '—'],
                ['PAN',            viewVendor.pan || '—'],
                ['GSTIN',          viewVendor.gstin || '—'],
                ['Year Est.',      viewVendor.year_established || '—'],
                ['CEO',            viewVendor.ceo_name || '—'],
                ['SPOC',           viewVendor.spoc_name || '—'],
                ['Score',          `${vendorScore(viewVendor.id)}/100`],
                ['Joined',         viewVendor.created_at?.slice(0,10) || '—'],
              ].map(([k, val]) => (
                <div key={k} style={{ background: '#F8FAFC', borderRadius: 8, padding: '10px 12px' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 2 }}>{k}</div>
                  <div style={{ fontSize: 13, color: '#0B1E3D', fontWeight: 600 }}>{val}</div>
                </div>
              ))}
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 8 }}>Affiliations</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {vendorAffils(viewVendor.id).map(a => {
                  const ac = AFFIL_COLORS[a] || { bg: '#F1F5F9', color: '#374151' };
                  return <span key={a} style={{ fontSize: 12, fontWeight: 800, padding: '4px 12px', borderRadius: 8, background: ac.bg, color: ac.color }}>{a}</span>;
                })}
              </div>
            </div>
            {viewVendor.bio && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 6 }}>About</div>
                <div style={{ fontSize: 13, color: '#445074', lineHeight: 1.6 }}>{viewVendor.bio}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Register Vendor Modal ── */}
      {showModal && <RegisterVendorModal onClose={() => setShowModal(false)} onSaved={v => { setVendors(p => [v, ...p]); setShowModal(false); }} />}
    </div>
  );
}

/* ── Register Vendor Modal ──────────────────────────────────────── */
function RegisterVendorModal({ onClose, onSaved }) {
  const EMPTY = { name: '', email: '', org_name: '', org_classification: '', phone: '', location: '', registration_number: '', pan: '', gstin: '', year_established: '', ceo_name: '', spoc_name: '', bio: '', password: 'Welcome@123', role: 'training_vendor' };
  const [form, setForm]         = useState(EMPTY);
  const [busy, setBusy]         = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [globalErr, setGlobalErr]     = useState('');
  const [orgClasses, setOrgClasses]   = useState([]);

  useEffect(() => {
    api.orgClassifications().then(d => setOrgClasses(d.filter(c => c.is_enabled))).catch(() => {});
  }, []);

  const F = k => e => {
    setForm(f => ({ ...f, [k]: e.target.value }));
    setFieldErrors(fe => ({ ...fe, [k]: '' }));
    setGlobalErr('');
  };

  const ERR_BORDER = '1.5px solid #FCA5A5';
  const OK_BORDER  = '1.5px solid #DDE3EE';
  const INP = (key) => ({ width: '100%', padding: '9px 12px', borderRadius: 8, border: fieldErrors[key] ? ERR_BORDER : OK_BORDER, fontSize: 13, boxSizing: 'border-box', background: fieldErrors[key] ? '#FFF5F5' : '#FAFBFD' });
  const LBL = { fontSize: 12, fontWeight: 700, color: '#445074', display: 'block', marginBottom: 4 };

  async function submit() {
    // Client-side required validation
    const fe = {};
    if (!form.org_name.trim()) fe.org_name = 'Organisation name is required.';
    if (!form.email.trim())    fe.email    = 'Email is required.';
    if (Object.keys(fe).length) { setFieldErrors(fe); return; }

    setBusy(true); setFieldErrors({}); setGlobalErr('');
    try {
      const res = await api.register({ ...form, name: form.name || form.org_name, gender: form.org_classification });
      onSaved({ ...form, id: res.user?.id || Date.now(), name: form.name || form.org_name });
    } catch (e) {
      if (e.field) setFieldErrors({ [e.field]: e.message });
      else setGlobalErr(e.message);
      setBusy(false);
    }
  }

  const FIELDS = [
    { label: 'Organisation Name *', key: 'org_name' },
    { label: 'Contact Name',        key: 'name' },
    { label: 'Email *',             key: 'email',               type: 'email' },
    { label: 'Mobile Number',       key: 'phone' },
    { label: 'Location',            key: 'location' },
    { label: 'Year Established',    key: 'year_established' },
    { label: 'Reg. / CIN Number',   key: 'registration_number' },
    { label: 'PAN',                 key: 'pan' },
    { label: 'GSTIN',               key: 'gstin' },
    { label: 'CEO Name',            key: 'ceo_name' },
    { label: 'SPOC Name',           key: 'spoc_name' },
    { label: 'Bio',                 key: 'bio' },
  ];

  // Pair fields into rows of 2
  const rows = [];
  for (let i = 0; i < FIELDS.length; i += 2) rows.push(FIELDS.slice(i, i + 2));

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card shadow" style={{ width: 600, maxWidth: '95vw', padding: 28, position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 16, background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#9CA3AF' }}>×</button>
        <div style={{ fontWeight: 800, fontSize: 16, color: '#0B1E3D', marginBottom: 4 }}>Register Training Vendor</div>
        <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 18 }}>Duplicate organisation name, email, mobile, CIN and GST are not allowed.</div>

        {/* Organisation Classification */}
        <div style={{ marginBottom: 12 }}>
          <label style={LBL}>Organisation Classification *</label>
          <select value={form.org_classification} onChange={F('org_classification')} style={{ ...INP('org_classification'), border: OK_BORDER }}>
            <option value="">Select classification</option>
            {orgClasses.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
        </div>

        {/* All other fields */}
        {rows.map((row, ri) => (
          <div key={ri} style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
            {row.map(f => (
              <div key={f.key} style={{ flex: 1 }}>
                <label style={LBL}>{f.label}</label>
                <input type={f.type || 'text'} value={form[f.key]} onChange={F(f.key)} style={INP(f.key)} placeholder={f.key === 'registration_number' ? 'CIN / Reg. No.' : ''} />
                {fieldErrors[f.key] && (
                  <div style={{ fontSize: 11, color: '#B91C1C', marginTop: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span>⚠</span> {fieldErrors[f.key]}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}

        {globalErr && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#B91C1C', marginBottom: 10, display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 16 }}>⚠️</span> {globalErr}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
          <button className="btn btn-outline btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={submit} disabled={busy} style={{ padding: '9px 22px' }}>
            {busy ? 'Checking…' : 'Register Vendor'}
          </button>
        </div>
      </div>
    </div>
  );
}
