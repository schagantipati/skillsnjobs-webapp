import { useState } from 'react';

const SEED_SCHEMES = [
  {
    id: 1, name: 'Pradhan Mantri Kaushal Vikas Yojana (PMKVY)',
    ministry: 'Ministry of Skill Development & Entrepreneurship',
    category: 'Skill Training', status: 'Active',
    beneficiaries: 'Youth aged 15–45', funding: '₹12,000 Cr',
    description: 'Flagship scheme for skill certification and monetary reward for prior learning.',
    link: 'https://pmkvyofficial.org', deadline: '2026-03-31',
  },
  {
    id: 2, name: 'National Apprenticeship Promotion Scheme (NAPS)',
    ministry: 'Ministry of Education',
    category: 'Apprenticeship', status: 'Active',
    beneficiaries: 'Graduates & Diploma holders', funding: '₹3,054 Cr',
    description: 'Promotes apprenticeship training by sharing 25% of stipend with employers.',
    link: 'https://apprenticeship.gov.in', deadline: '2025-12-31',
  },
  {
    id: 3, name: 'PM SVANidhi – Street Vendor Scheme',
    ministry: 'Ministry of Housing & Urban Affairs',
    category: 'Self Employment', status: 'Active',
    beneficiaries: 'Street vendors', funding: '₹700 Cr',
    description: 'Micro-credit facility of ₹10,000–₹50,000 for urban street vendors.',
    link: 'https://pmsvanidhi.mohua.gov.in', deadline: '2025-12-31',
  },
  {
    id: 4, name: 'Deen Dayal Upadhyaya Grameen Kaushalya Yojana (DDU-GKY)',
    ministry: 'Ministry of Rural Development',
    category: 'Rural Employment', status: 'Active',
    beneficiaries: 'Rural youth 15–35 years', funding: '₹1,500 Cr',
    description: 'Skill training and placement for rural poor youth with post-placement support.',
    link: 'https://ddugky.gov.in', deadline: '2026-03-31',
  },
  {
    id: 5, name: 'Startup India Seed Fund',
    ministry: 'Ministry of Commerce & Industry',
    category: 'Entrepreneurship', status: 'Active',
    beneficiaries: 'Early-stage startups', funding: '₹945 Cr',
    description: 'Seed funding up to ₹20 lakhs for proof of concept and ₹50 lakhs for commercialisation.',
    link: 'https://seedfund.startupindia.gov.in', deadline: '2025-09-30',
  },
];

const CATEGORIES = ['All','Skill Training','Apprenticeship','Self Employment','Rural Employment','Entrepreneurship','Placement'];
const STATUSES   = ['All','Active','Upcoming','Closed'];

const COLORS = {
  'Skill Training': '#1E5FBF', 'Apprenticeship': '#0A7B6C', 'Self Employment': '#D97706',
  'Rural Employment': '#065F46', 'Entrepreneurship': '#7C3AED', 'Placement': '#C0392B',
};

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card shadow" style={{ width: 560, maxWidth: '95vw', padding: 28, position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ fontWeight: 800, fontSize: 15, color: '#0B1E3D', marginBottom: 18 }}>{title}</div>
        {children}
        <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 16, background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#9CA3AF' }}>×</button>
      </div>
    </div>
  );
}

const EMPTY = { name: '', ministry: '', category: 'Skill Training', status: 'Active', beneficiaries: '', funding: '', description: '', link: '', deadline: '' };
let _id = 200;
const uid = () => ++_id;

export default function GovernmentSchemes() {
  const [schemes, setSchemes] = useState(SEED_SCHEMES);
  const [catFilter, setCatFilter]   = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch]   = useState('');
  const [modal, setModal]     = useState(null); // null | 'add' | 'edit' | 'view'
  const [editing, setEditing] = useState(null);
  const [form, setForm]       = useState(EMPTY);

  const filtered = schemes.filter(s =>
    (catFilter === 'All' || s.category === catFilter) &&
    (statusFilter === 'All' || s.status === statusFilter) &&
    (s.name.toLowerCase().includes(search.toLowerCase()) || s.ministry.toLowerCase().includes(search.toLowerCase()))
  );

  function openAdd()       { setForm(EMPTY); setModal('add'); }
  function openEdit(s)     { setEditing(s); setForm({ ...s }); setModal('edit'); }
  function openView(s)     { setEditing(s); setModal('view'); }
  function save() {
    if (!form.name.trim()) return;
    if (modal === 'add') setSchemes(p => [...p, { id: uid(), ...form }]);
    else setSchemes(p => p.map(s => s.id === editing.id ? { ...s, ...form } : s));
    setModal(null);
  }
  function del(id) { if (confirm('Delete this scheme?')) setSchemes(p => p.filter(s => s.id !== id)); }

  const statusColor = (st) => st === 'Active' ? { bg: '#D1FAE5', fg: '#065F46' } : st === 'Upcoming' ? { bg: '#FEF3C7', fg: '#92400E' } : { bg: '#F1F5F9', fg: '#6B7280' };

  const F = ({ label, req, children }) => (
    <div>
      <label style={{ fontSize: 12, fontWeight: 700, color: '#445074', display: 'block', marginBottom: 5 }}>{label}{req && ' *'}</label>
      {children}
    </div>
  );
  const inp = (key, props = {}) => (
    <input value={form[key] || ''} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
      style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #DDE3EE', fontSize: 13, boxSizing: 'border-box' }} {...props} />
  );

  return (
    <div className="page" style={{ maxWidth: 1100 }}>
      <div className="page-header">
        <h1>Government Schemes</h1>
        <p>Manage PM schemes, apprenticeship programmes, and government employment initiatives.</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total Schemes', val: schemes.length, color: '#1E5FBF' },
          { label: 'Active',        val: schemes.filter(s => s.status === 'Active').length,    color: '#065F46' },
          { label: 'Upcoming',      val: schemes.filter(s => s.status === 'Upcoming').length,  color: '#D97706' },
          { label: 'Categories',    val: [...new Set(schemes.map(s => s.category))].length,    color: '#7C3AED' },
        ].map(st => (
          <div key={st.label} className="card shadow" style={{ padding: '14px 18px', borderLeft: `4px solid ${st.color}` }}>
            <div style={{ fontWeight: 800, fontSize: 22, color: st.color }}>{st.val}</div>
            <div style={{ fontSize: 12, color: '#7886A6', fontWeight: 600 }}>{st.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search schemes…"
          style={{ flex: 1, minWidth: 200, padding: '9px 14px', borderRadius: 9, border: '1.5px solid #DDE3EE', fontSize: 13, background: '#FAFBFD' }} />
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
          style={{ padding: '9px 12px', borderRadius: 9, border: '1.5px solid #DDE3EE', fontSize: 13, background: '#FAFBFD' }}>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          style={{ padding: '9px 12px', borderRadius: 9, border: '1.5px solid #DDE3EE', fontSize: 13, background: '#FAFBFD' }}>
          {STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
        <button className="btn btn-primary btn-sm" onClick={openAdd}>+ Add Scheme</button>
      </div>

      {/* Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {filtered.map(s => {
          const col = COLORS[s.category] || '#374151';
          const st  = statusColor(s.status);
          return (
            <div key={s.id} className="card shadow" style={{ padding: 0, overflow: 'hidden', cursor: 'pointer' }} onClick={() => openView(s)}>
              <div style={{ background: col, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.8)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.category}</span>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 12, background: st.bg, color: st.fg }}>{s.status}</span>
              </div>
              <div style={{ padding: '14px 16px' }}>
                <div style={{ fontWeight: 800, fontSize: 13, color: '#0B1E3D', marginBottom: 5, lineHeight: 1.4 }}>{s.name}</div>
                <div style={{ fontSize: 11, color: '#7886A6', marginBottom: 10 }}>{s.ministry}</div>
                <div style={{ fontSize: 12, color: '#445074', marginBottom: 12, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{s.description}</div>
                <div style={{ display: 'flex', gap: 16, fontSize: 11, color: '#9CA3AF', marginBottom: 12 }}>
                  {s.funding && <span>💰 {s.funding}</span>}
                  {s.deadline && <span>📅 {s.deadline}</span>}
                </div>
                <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                  <button className="btn btn-outline btn-sm" onClick={() => openEdit(s)} style={{ flex: 1, fontSize: 11 }}>Edit</button>
                  <button onClick={() => del(s.id)} style={{ padding: '4px 10px', borderRadius: 7, border: '1px solid #FECACA', background: '#FEF2F2', color: '#B91C1C', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>Delete</button>
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 40, color: '#9CA3AF', fontSize: 13 }}>No schemes match your filters.</div>
        )}
      </div>

      {/* View Modal */}
      {modal === 'view' && editing && (
        <Modal title="" onClose={() => setModal(null)}>
          <div style={{ marginTop: -10 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 12, background: (COLORS[editing.category] || '#999') + '18', color: COLORS[editing.category] || '#999' }}>{editing.category}</span>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 12, ...(() => { const s = statusColor(editing.status); return { background: s.bg, color: s.fg }; })() }}>{editing.status}</span>
            </div>
            <div style={{ fontWeight: 800, fontSize: 16, color: '#0B1E3D', marginBottom: 4, lineHeight: 1.4 }}>{editing.name}</div>
            <div style={{ fontSize: 12, color: '#7886A6', marginBottom: 14 }}>{editing.ministry}</div>
            <div style={{ fontSize: 13, color: '#445074', lineHeight: 1.7, marginBottom: 16 }}>{editing.description}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              {[['Beneficiaries', editing.beneficiaries],['Funding', editing.funding],['Deadline', editing.deadline],['Link', editing.link]].map(([k, v]) =>
                v ? <div key={k} style={{ background: '#F8FAFC', borderRadius: 8, padding: '10px 12px' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 3 }}>{k}</div>
                  <div style={{ fontSize: 12, color: '#0B1E3D', fontWeight: 600, wordBreak: 'break-all' }}>{v}</div>
                </div> : null
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn btn-outline btn-sm" onClick={() => setModal(null)}>Close</button>
              <button className="btn btn-primary btn-sm" onClick={() => openEdit(editing)}>Edit</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add/Edit Modal */}
      {(modal === 'add' || modal === 'edit') && (
        <Modal title={modal === 'add' ? 'Add Government Scheme' : 'Edit Scheme'} onClose={() => setModal(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <F label="Scheme Name" req><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. PMKVY 4.0" style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #DDE3EE', fontSize: 13, boxSizing: 'border-box' }} /></F>
            <F label="Ministry / Department"><input value={form.ministry} onChange={e => setForm(f => ({ ...f, ministry: e.target.value }))} placeholder="e.g. Ministry of Skill Development" style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #DDE3EE', fontSize: 13, boxSizing: 'border-box' }} /></F>
            <div style={{ display: 'flex', gap: 12 }}>
              <F label="Category">
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #DDE3EE', fontSize: 13 }}>
                  {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}
                </select>
              </F>
              <F label="Status">
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #DDE3EE', fontSize: 13 }}>
                  {STATUSES.filter(s => s !== 'All').map(s => <option key={s}>{s}</option>)}
                </select>
              </F>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <F label="Beneficiaries"><input value={form.beneficiaries} onChange={e => setForm(f => ({ ...f, beneficiaries: e.target.value }))} placeholder="e.g. Youth aged 18–35" style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #DDE3EE', fontSize: 13, boxSizing: 'border-box' }} /></F>
              <F label="Funding Amount"><input value={form.funding} onChange={e => setForm(f => ({ ...f, funding: e.target.value }))} placeholder="e.g. ₹5,000 Cr" style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #DDE3EE', fontSize: 13, boxSizing: 'border-box' }} /></F>
            </div>
            <F label="Description"><textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} placeholder="Brief description of the scheme…" style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #DDE3EE', fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }} /></F>
            <div style={{ display: 'flex', gap: 12 }}>
              <F label="Official Link"><input value={form.link} onChange={e => setForm(f => ({ ...f, link: e.target.value }))} placeholder="https://…" style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #DDE3EE', fontSize: 13, boxSizing: 'border-box' }} /></F>
              <F label="Deadline"><input type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #DDE3EE', fontSize: 13, boxSizing: 'border-box' }} /></F>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 6 }}>
              <button className="btn btn-outline btn-sm" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={save}>Save Scheme</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
