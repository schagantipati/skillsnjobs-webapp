import { useState } from 'react';

/* ── Seed data ──────────────────────────────────────────────────── */
const SEED_SECTORS = [
  { id: 1, name: 'Information Technology', color: '#1E5FBF', icon: '💻' },
  { id: 2, name: 'Healthcare & Pharma',    color: '#0A7B6C', icon: '🏥' },
  { id: 3, name: 'Banking & Finance',       color: '#0891B2', icon: '🏦' },
  { id: 4, name: 'Manufacturing',           color: '#7C3AED', icon: '🏭' },
  { id: 5, name: 'Construction',            color: '#D97706', icon: '🏗️' },
  { id: 6, name: 'Retail & E-commerce',     color: '#C0392B', icon: '🛍️' },
  { id: 7, name: 'Education & Training',    color: '#065F46', icon: '🎓' },
  { id: 8, name: 'Agriculture',             color: '#166534', icon: '🌾' },
];

const SEED_SKILL_CATS = [
  { id: 1, sector_id: 1, name: 'Web Development',      tags: ['React','Node.js','HTML','CSS','TypeScript'] },
  { id: 2, sector_id: 1, name: 'Data Science & AI',    tags: ['Python','ML','TensorFlow','SQL','Pandas'] },
  { id: 3, sector_id: 2, name: 'Nursing & Patient Care',tags: ['ICU','Critical Care','Patient Management'] },
  { id: 4, sector_id: 3, name: 'Financial Analysis',    tags: ['Excel','Power BI','Accounting','Tally'] },
  { id: 5, sector_id: 4, name: 'CNC Operation',         tags: ['CNC','AutoCAD','Drilling','Milling'] },
];

const SEED_COURSE_TAGS = ['Python','React','SQL','Communication','Leadership','Excel',
  'Tally','AutoCAD','English','MS Office','Accounting','Machine Learning','Nursing','Welding','Stitching'];

const COLORS = ['#1E5FBF','#0A7B6C','#0891B2','#7C3AED','#D97706','#C0392B','#065F46','#166534','#374151','#BE185D'];

/* ── Helpers ─────────────────────────────────────────────────────── */
let _id = 100;
const uid = () => ++_id;

function Pill({ label, onRemove, color = '#6B9EF0' }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: color + '18', color, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, border: `1px solid ${color}40` }}>
      {label}
      {onRemove && <button onClick={onRemove} style={{ background: 'none', border: 'none', cursor: 'pointer', color, fontSize: 13, lineHeight: 1, padding: 0, marginLeft: 2 }}>×</button>}
    </span>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card shadow" style={{ width: 480, maxWidth: '95vw', padding: 28, position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ fontWeight: 800, fontSize: 15, color: '#0B1E3D', marginBottom: 18 }}>{title}</div>
        {children}
        <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 16, background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#9CA3AF' }}>×</button>
      </div>
    </div>
  );
}

/* ── Main ─────────────────────────────────────────────────────────── */
export default function SectorsCategories() {
  const [tab, setTab] = useState('sectors');
  const [sectors, setSectors]       = useState(SEED_SECTORS);
  const [skillCats, setSkillCats]   = useState(SEED_SKILL_CATS);
  const [courseTags, setCourseTags] = useState(SEED_COURSE_TAGS);

  const [modal, setModal]   = useState(null); // 'add-sector' | 'edit-sector' | 'add-cat' | 'edit-cat'
  const [editing, setEditing] = useState(null);
  const [form, setForm]     = useState({});
  const [tagInput, setTagInput] = useState('');
  const [newTag, setNewTag] = useState('');
  const [search, setSearch] = useState('');

  /* Sector helpers */
  function openAddSector()     { setForm({ name: '', icon: '🏢', color: COLORS[sectors.length % COLORS.length] }); setModal('add-sector'); }
  function openEditSector(s)   { setEditing(s); setForm({ name: s.name, icon: s.icon, color: s.color }); setModal('edit-sector'); }
  function saveSector() {
    if (!form.name.trim()) return;
    if (modal === 'add-sector') setSectors(p => [...p, { id: uid(), ...form }]);
    else setSectors(p => p.map(s => s.id === editing.id ? { ...s, ...form } : s));
    setModal(null);
  }
  function deleteSector(id) { if (confirm('Delete this sector?')) { setSectors(p => p.filter(s => s.id !== id)); setSkillCats(p => p.filter(c => c.sector_id !== id)); } }

  /* Skill category helpers */
  function openAddCat()      { setForm({ sector_id: sectors[0]?.id || '', name: '', tags: [] }); setTagInput(''); setModal('add-cat'); }
  function openEditCat(c)    { setEditing(c); setForm({ ...c, tags: [...c.tags] }); setTagInput(''); setModal('edit-cat'); }
  function addTagToForm()    { const t = tagInput.trim(); if (t && !form.tags.includes(t)) setForm(f => ({ ...f, tags: [...f.tags, t] })); setTagInput(''); }
  function removeTagFromForm(t) { setForm(f => ({ ...f, tags: f.tags.filter(x => x !== t) })); }
  function saveCat() {
    if (!form.name.trim()) return;
    if (modal === 'add-cat') setSkillCats(p => [...p, { id: uid(), ...form }]);
    else setSkillCats(p => p.map(c => c.id === editing.id ? { ...c, ...form } : c));
    setModal(null);
  }
  function deleteCat(id) { if (confirm('Delete this category?')) setSkillCats(p => p.filter(c => c.id !== id)); }

  /* Course tag helpers */
  function addCourseTag() { const t = newTag.trim(); if (t && !courseTags.includes(t)) setCourseTags(p => [...p, t]); setNewTag(''); }
  function deleteCourseTag(t) { setCourseTags(p => p.filter(x => x !== t)); }

  const filteredSectors = sectors.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));
  const filteredCats    = skillCats.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.tags.some(t => t.toLowerCase().includes(search.toLowerCase())));

  const TAB_STYLE = (k) => ({
    padding: '8px 18px', fontSize: 13, fontWeight: 700, borderRadius: 8, border: 'none', cursor: 'pointer',
    background: tab === k ? '#1E5FBF' : 'transparent',
    color: tab === k ? '#fff' : '#7886A6',
    transition: 'all .15s',
  });

  return (
    <div className="page" style={{ maxWidth: 1000 }}>
      <div className="page-header">
        <h1>Sectors & Categories</h1>
        <p>Manage job sectors, skill categories, and course tags used across the platform.</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 24, background: '#F1F5F9', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        <button style={TAB_STYLE('sectors')} onClick={() => setTab('sectors')}>Job Sectors</button>
        <button style={TAB_STYLE('skills')} onClick={() => setTab('skills')}>Skill Categories</button>
        <button style={TAB_STYLE('tags')} onClick={() => setTab('tags')}>Course Tags</button>
      </div>

      {/* Search + Add */}
      {tab !== 'tags' && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={`Search ${tab === 'sectors' ? 'sectors' : 'categories'}…`}
            style={{ flex: 1, padding: '9px 14px', borderRadius: 9, border: '1.5px solid #DDE3EE', fontSize: 13, background: '#FAFBFD' }} />
          <button className="btn btn-primary btn-sm" onClick={tab === 'sectors' ? openAddSector : openAddCat}>
            + Add {tab === 'sectors' ? 'Sector' : 'Category'}
          </button>
        </div>
      )}

      {/* ── SECTORS TAB ── */}
      {tab === 'sectors' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
          {filteredSectors.map(s => (
            <div key={s.id} className="card shadow" style={{ padding: '16px 18px', borderLeft: `4px solid ${s.color}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 22 }}>{s.icon}</span>
                <span style={{ fontWeight: 700, fontSize: 13, color: '#0B1E3D', flex: 1 }}>{s.name}</span>
              </div>
              <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 12 }}>
                {skillCats.filter(c => c.sector_id === s.id).length} skill categories
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn-outline btn-sm" onClick={() => openEditSector(s)} style={{ flex: 1, fontSize: 11 }}>Edit</button>
                <button onClick={() => deleteSector(s.id)} style={{ padding: '4px 10px', borderRadius: 7, border: '1px solid #FECACA', background: '#FEF2F2', color: '#B91C1C', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>Delete</button>
              </div>
            </div>
          ))}
          {filteredSectors.length === 0 && <div style={{ color: '#9CA3AF', fontSize: 13 }}>No sectors found.</div>}
        </div>
      )}

      {/* ── SKILL CATEGORIES TAB ── */}
      {tab === 'skills' && (
        <div className="card shadow" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#0F2545' }}>
                {['Sector','Category Name','Skill Tags','Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', color: 'rgba(255,255,255,.6)', fontSize: 11, fontWeight: 700, textAlign: 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredCats.map((c, i) => {
                const sec = sectors.find(s => s.id === c.sector_id);
                return (
                  <tr key={c.id} style={{ background: i % 2 === 0 ? '#fff' : '#FAFBFD', borderBottom: '1px solid #EEF2F8' }}>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 12, background: (sec?.color || '#999') + '18', color: sec?.color || '#999' }}>{sec?.name || '—'}</span>
                    </td>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: '#0B1E3D' }}>{c.name}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {c.tags.map(t => <Pill key={t} label={t} color={sec?.color || '#6B9EF0'} />)}
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-outline btn-sm" onClick={() => openEditCat(c)} style={{ fontSize: 11 }}>Edit</button>
                        <button onClick={() => deleteCat(c.id)} style={{ padding: '4px 10px', borderRadius: 7, border: '1px solid #FECACA', background: '#FEF2F2', color: '#B91C1C', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredCats.length === 0 && (
                <tr><td colSpan={4} style={{ padding: 24, textAlign: 'center', color: '#9CA3AF' }}>No categories found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── COURSE TAGS TAB ── */}
      {tab === 'tags' && (
        <div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
            <input value={newTag} onChange={e => setNewTag(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCourseTag()}
              placeholder="Type a tag and press Enter or Add…"
              style={{ flex: 1, padding: '9px 14px', borderRadius: 9, border: '1.5px solid #DDE3EE', fontSize: 13, background: '#FAFBFD' }} />
            <button className="btn btn-primary btn-sm" onClick={addCourseTag}>+ Add Tag</button>
          </div>
          <div className="card shadow" style={{ padding: 20 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {courseTags.map(t => (
                <Pill key={t} label={t} color="#1E5FBF" onRemove={() => deleteCourseTag(t)} />
              ))}
              {courseTags.length === 0 && <span style={{ color: '#9CA3AF', fontSize: 13 }}>No tags yet.</span>}
            </div>
          </div>
          <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 10 }}>{courseTags.length} tags total · Click × on any tag to remove it</div>
        </div>
      )}

      {/* ── MODALS ── */}
      {(modal === 'add-sector' || modal === 'edit-sector') && (
        <Modal title={modal === 'add-sector' ? 'Add Sector' : 'Edit Sector'} onClose={() => setModal(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#445074', display: 'block', marginBottom: 5 }}>Sector Name *</label>
              <input value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Information Technology"
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #DDE3EE', fontSize: 13 }} />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#445074', display: 'block', marginBottom: 5 }}>Icon (emoji)</label>
                <input value={form.icon || ''} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #DDE3EE', fontSize: 20 }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#445074', display: 'block', marginBottom: 5 }}>Color</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                  {COLORS.map(c => (
                    <div key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                      style={{ width: 24, height: 24, borderRadius: '50%', background: c, cursor: 'pointer', border: form.color === c ? '3px solid #0B1E3D' : '2px solid transparent' }} />
                  ))}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 6 }}>
              <button className="btn btn-outline btn-sm" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={saveSector}>Save Sector</button>
            </div>
          </div>
        </Modal>
      )}

      {(modal === 'add-cat' || modal === 'edit-cat') && (
        <Modal title={modal === 'add-cat' ? 'Add Skill Category' : 'Edit Skill Category'} onClose={() => setModal(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#445074', display: 'block', marginBottom: 5 }}>Sector *</label>
              <select value={form.sector_id || ''} onChange={e => setForm(f => ({ ...f, sector_id: Number(e.target.value) }))}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #DDE3EE', fontSize: 13 }}>
                {sectors.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#445074', display: 'block', marginBottom: 5 }}>Category Name *</label>
              <input value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Web Development"
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #DDE3EE', fontSize: 13 }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#445074', display: 'block', marginBottom: 5 }}>Skill Tags</label>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTagToForm()}
                  placeholder="Type a skill and press Enter"
                  style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1.5px solid #DDE3EE', fontSize: 13 }} />
                <button className="btn btn-outline btn-sm" onClick={addTagToForm}>Add</button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {(form.tags || []).map(t => <Pill key={t} label={t} color="#1E5FBF" onRemove={() => removeTagFromForm(t)} />)}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 6 }}>
              <button className="btn btn-outline btn-sm" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={saveCat}>Save Category</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
