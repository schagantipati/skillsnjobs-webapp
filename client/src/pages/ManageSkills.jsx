import { useState } from 'react';
import { useSkills } from '../context/SkillsContext.jsx';

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card shadow" style={{ width: 540, maxWidth: '95vw', padding: 28, position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ fontWeight: 800, fontSize: 15, color: '#0B1E3D', marginBottom: 18 }}>{title}</div>
        {children}
        <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 16, background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#9CA3AF' }}>×</button>
      </div>
    </div>
  );
}

let _uid = 9000;
const uid = () => `uid-${++_uid}`;

export default function ManageSkills() {
  const { skills, setSkills } = useSkills();

  const [search, setSearch]       = useState('');
  const [activeSector, setActiveSector] = useState(null); // null = all
  const [expanded, setExpanded]   = useState({});         // skillId → bool
  const [modal, setModal]         = useState(null);       // 'add-sector'|'edit-sector'|'add-skill'|'edit-skill'|'add-sub'|'edit-sub'
  const [ctx, setCtx]             = useState({});         // context for modal
  const [form, setForm]           = useState({});
  const [saved, setSaved]         = useState('');

  /* ── helpers ── */
  function flash(msg) { setSaved(msg); setTimeout(() => setSaved(''), 2000); }
  function toggleExpand(id) { setExpanded(e => ({ ...e, [id]: !e[id] })); }

  /* Sector CRUD */
  function openAddSector() { setForm({ sector: '', code: '', icon: '🔧', color: '#1E5FBF' }); setModal('add-sector'); }
  function openEditSector(s) { setCtx({ s }); setForm({ sector: s.sector, code: s.code, icon: s.icon, color: s.color }); setModal('edit-sector'); }
  function saveSector() {
    if (!form.sector.trim()) return;
    if (modal === 'add-sector') {
      setSkills(p => [...p, { id: uid(), ...form, skills: [] }]);
    } else {
      setSkills(p => p.map(s => s.id === ctx.s.id ? { ...s, ...form } : s));
    }
    setModal(null); flash('Sector saved');
  }
  function deleteSector(id) {
    if (!confirm('Delete this sector and all its skills?')) return;
    setSkills(p => p.filter(s => s.id !== id));
  }

  /* Skill CRUD */
  function openAddSkill(sector) { setCtx({ sector }); setForm({ name: '', subSkills: [] }); setCtx(c => ({ ...c, subInput: '' })); setModal('add-skill'); }
  function openEditSkill(sector, skill) { setCtx({ sector, skill }); setForm({ name: skill.name, subSkills: [...skill.subSkills] }); setModal('edit-skill'); }
  function saveSkill() {
    if (!form.name.trim()) return;
    setSkills(p => p.map(s => {
      if (s.id !== ctx.sector.id) return s;
      if (modal === 'add-skill') return { ...s, skills: [...s.skills, { id: uid(), name: form.name, subSkills: form.subSkills }] };
      return { ...s, skills: s.skills.map(sk => sk.id === ctx.skill.id ? { ...sk, name: form.name, subSkills: form.subSkills } : sk) };
    }));
    setModal(null); flash('Skill saved');
  }
  function deleteSkill(sectorId, skillId) {
    if (!confirm('Delete this skill and its sub-skills?')) return;
    setSkills(p => p.map(s => s.id === sectorId ? { ...s, skills: s.skills.filter(sk => sk.id !== skillId) } : s));
  }

  /* Sub-skill CRUD (inline in modal) */
  function addSubToForm(val) {
    const v = val.trim();
    if (v && !form.subSkills.includes(v)) setForm(f => ({ ...f, subSkills: [...f.subSkills, v] }));
  }
  function removeSubFromForm(sub) { setForm(f => ({ ...f, subSkills: f.subSkills.filter(x => x !== sub) })); }

  /* Sub-skill inline add (on expanded skill row) */
  function addSubInline(sectorId, skillId, val) {
    const v = val.trim();
    if (!v) return;
    setSkills(p => p.map(s => s.id === sectorId
      ? { ...s, skills: s.skills.map(sk => sk.id === skillId && !sk.subSkills.includes(v)
          ? { ...sk, subSkills: [...sk.subSkills, v] } : sk) }
      : s));
  }
  function removeSubInline(sectorId, skillId, sub) {
    setSkills(p => p.map(s => s.id === sectorId
      ? { ...s, skills: s.skills.map(sk => sk.id === skillId ? { ...sk, subSkills: sk.subSkills.filter(x => x !== sub) } : sk) }
      : s));
  }

  /* ── filtered view ── */
  const q = search.toLowerCase();
  const displaySectors = skills
    .filter(s => !activeSector || s.id === activeSector)
    .map(s => ({
      ...s,
      skills: s.skills.filter(sk =>
        !q || sk.name.toLowerCase().includes(q) || sk.subSkills.some(ss => ss.toLowerCase().includes(q))
      ),
    }))
    .filter(s => !q || s.skills.length > 0 || s.sector.toLowerCase().includes(q));

  const totalSkills    = skills.reduce((n, s) => n + s.skills.length, 0);
  const totalSubSkills = skills.reduce((n, s) => n + s.skills.reduce((m, sk) => m + sk.subSkills.length, 0), 0);

  const COLORS = ['#1E5FBF','#0A7B6C','#0891B2','#7C3AED','#D97706','#C0392B','#065F46','#166534','#374151','#BE185D','#9D174D','#1F2937'];

  return (
    <div className="page" style={{ maxWidth: 1100 }}>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1>Manage Skills</h1>
            <p>NSDL / Central Govt. skill registry — sectors, skills, and sub-skills used across the platform as dropdowns.</p>
          </div>
          {saved && <div style={{ background: '#ECFDF5', color: '#065F46', fontSize: 12, fontWeight: 700, padding: '6px 14px', borderRadius: 20, border: '1px solid #A7F3D0' }}>✓ {saved}</div>}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 22 }}>
        {[
          { label: 'Sectors', val: skills.length,    color: '#1E5FBF' },
          { label: 'Skills',  val: totalSkills,       color: '#0A7B6C' },
          { label: 'Sub-Skills', val: totalSubSkills, color: '#7C3AED' },
        ].map(st => (
          <div key={st.label} className="card shadow" style={{ padding: '14px 18px', borderLeft: `4px solid ${st.color}` }}>
            <div style={{ fontWeight: 800, fontSize: 26, color: st.color }}>{st.val}</div>
            <div style={{ fontSize: 12, color: '#7886A6', fontWeight: 600 }}>{st.label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search skills or sub-skills…"
          style={{ flex: 1, minWidth: 200, padding: '9px 14px', borderRadius: 9, border: '1.5px solid #DDE3EE', fontSize: 13, background: '#FAFBFD' }} />
        <select value={activeSector || ''} onChange={e => setActiveSector(e.target.value || null)}
          style={{ padding: '9px 12px', borderRadius: 9, border: '1.5px solid #DDE3EE', fontSize: 13, background: '#FAFBFD' }}>
          <option value="">All Sectors</option>
          {skills.map(s => <option key={s.id} value={s.id}>{s.icon} {s.sector}</option>)}
        </select>
        <button className="btn btn-outline btn-sm" onClick={openAddSector}>+ Add Sector</button>
      </div>

      {/* Sector accordion list */}
      {displaySectors.map(sector => (
        <div key={sector.id} className="card shadow" style={{ marginBottom: 14, padding: 0, overflow: 'hidden' }}>
          {/* Sector header */}
          <div style={{ background: sector.color, padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 20 }}>{sector.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 14, color: '#fff' }}>{sector.sector}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.65)' }}>{sector.code} · {sector.skills.length} skills · {sector.skills.reduce((n, sk) => n + sk.subSkills.length, 0)} sub-skills</div>
            </div>
            <button onClick={() => openAddSkill(sector)} style={{ background: 'rgba(255,255,255,.18)', border: '1px solid rgba(255,255,255,.35)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 7, cursor: 'pointer' }}>+ Add Skill</button>
            <button onClick={() => openEditSector(sector)} style={{ background: 'rgba(255,255,255,.18)', border: '1px solid rgba(255,255,255,.35)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 7, cursor: 'pointer' }}>Edit</button>
            <button onClick={() => deleteSector(sector.id)} style={{ background: 'rgba(255,50,50,.25)', border: '1px solid rgba(255,120,120,.4)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 7, cursor: 'pointer' }}>Delete</button>
          </div>

          {/* Skills list */}
          {sector.skills.length === 0
            ? <div style={{ padding: '16px 20px', color: '#9CA3AF', fontSize: 13 }}>No skills yet. Click "+ Add Skill" above.</div>
            : sector.skills.map((skill, si) => {
              const isOpen = !!expanded[skill.id];
              return (
                <div key={skill.id} style={{ borderBottom: si < sector.skills.length - 1 ? '1px solid #EEF2F8' : 'none' }}>
                  {/* Skill row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 18px', background: si % 2 === 0 ? '#fff' : '#FAFBFD' }}>
                    <button onClick={() => toggleExpand(skill.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#9CA3AF', width: 20, flexShrink: 0, transition: 'transform .15s', transform: isOpen ? 'rotate(90deg)' : 'none' }}>▶</button>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#0B1E3D' }}>{skill.name}</div>
                      <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{skill.subSkills.length} sub-skills</div>
                    </div>
                    {/* Sub-skill pills preview */}
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', maxWidth: 420 }}>
                      {skill.subSkills.slice(0, 5).map(ss => (
                        <span key={ss} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 12, background: sector.color + '18', color: sector.color, fontWeight: 600, border: `1px solid ${sector.color}30` }}>{ss}</span>
                      ))}
                      {skill.subSkills.length > 5 && <span style={{ fontSize: 10, color: '#9CA3AF', padding: '2px 4px' }}>+{skill.subSkills.length - 5} more</span>}
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button className="btn btn-outline btn-sm" onClick={() => openEditSkill(sector, skill)} style={{ fontSize: 11, padding: '4px 10px' }}>Edit</button>
                      <button onClick={() => deleteSkill(sector.id, skill.id)} style={{ padding: '4px 10px', borderRadius: 7, border: '1px solid #FECACA', background: '#FEF2F2', color: '#B91C1C', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>Delete</button>
                    </div>
                  </div>

                  {/* Expanded sub-skills */}
                  {isOpen && (
                    <div style={{ background: '#F8FAFC', padding: '12px 20px 14px 52px', borderTop: '1px solid #EEF2F8' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>Sub-Skills</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 12 }}>
                        {skill.subSkills.map(ss => (
                          <span key={ss} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, padding: '4px 10px', borderRadius: 20, background: sector.color + '18', color: sector.color, fontWeight: 600, border: `1px solid ${sector.color}30` }}>
                            {ss}
                            <button onClick={() => removeSubInline(sector.id, skill.id, ss)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: sector.color, fontSize: 13, lineHeight: 1, padding: 0, opacity: .7 }}>×</button>
                          </span>
                        ))}
                        {skill.subSkills.length === 0 && <span style={{ fontSize: 12, color: '#9CA3AF' }}>No sub-skills yet.</span>}
                      </div>
                      {/* Inline add */}
                      <InlineAdd color={sector.color} onAdd={val => addSubInline(sector.id, skill.id, val)} />
                    </div>
                  )}
                </div>
              );
            })
          }
        </div>
      ))}

      {displaySectors.length === 0 && (
        <div style={{ textAlign: 'center', padding: 48, color: '#9CA3AF', fontSize: 13 }}>No skills match your search.</div>
      )}

      {/* ── ADD / EDIT SECTOR MODAL ── */}
      {(modal === 'add-sector' || modal === 'edit-sector') && (
        <Modal title={modal === 'add-sector' ? 'Add Sector' : 'Edit Sector'} onClose={() => setModal(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={LBL}>Sector Name *</label>
              <input value={form.sector || ''} onChange={e => setForm(f => ({ ...f, sector: e.target.value }))} placeholder="e.g. Healthcare & Life Sciences" style={INP} />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={LBL}>NSDC / Sector Code</label>
                <input value={form.code || ''} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="e.g. HSS/Q5101" style={INP} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={LBL}>Icon (emoji)</label>
                <input value={form.icon || ''} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} style={{ ...INP, fontSize: 22 }} />
              </div>
            </div>
            <div>
              <label style={LBL}>Colour</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                {COLORS.map(c => (
                  <div key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                    style={{ width: 26, height: 26, borderRadius: '50%', background: c, cursor: 'pointer', border: form.color === c ? '3px solid #0B1E3D' : '2px solid transparent', transition: 'border .1s' }} />
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 6 }}>
              <button className="btn btn-outline btn-sm" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={saveSector}>Save Sector</button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── ADD / EDIT SKILL MODAL ── */}
      {(modal === 'add-skill' || modal === 'edit-skill') && (
        <Modal title={modal === 'add-skill' ? `Add Skill — ${ctx.sector?.sector}` : `Edit Skill`} onClose={() => setModal(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={LBL}>Skill Name *</label>
              <input value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Web Development" style={INP} />
            </div>
            <div>
              <label style={LBL}>Sub-Skills</label>
              <SubSkillEditor subSkills={form.subSkills || []} onAdd={addSubToForm} onRemove={removeSubFromForm} color={ctx.sector?.color || '#1E5FBF'} />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 6 }}>
              <button className="btn btn-outline btn-sm" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={saveSkill}>Save Skill</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ── inline sub-skill add bar ── */
function InlineAdd({ color, onAdd }) {
  const [val, setVal] = useState('');
  function go() { onAdd(val); setVal(''); }
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <input value={val} onChange={e => setVal(e.target.value)} onKeyDown={e => e.key === 'Enter' && go()}
        placeholder="Add sub-skill…"
        style={{ flex: 1, padding: '6px 10px', borderRadius: 7, border: '1.5px solid #DDE3EE', fontSize: 12, background: '#fff' }} />
      <button onClick={go} style={{ padding: '6px 14px', borderRadius: 7, border: `1.5px solid ${color}`, background: color + '18', color, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Add</button>
    </div>
  );
}

/* ── sub-skill editor inside modal ── */
function SubSkillEditor({ subSkills, onAdd, onRemove, color }) {
  const [val, setVal] = useState('');
  function go() { if (val.trim()) { onAdd(val.trim()); setVal(''); } }
  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <input value={val} onChange={e => setVal(e.target.value)} onKeyDown={e => e.key === 'Enter' && go()}
          placeholder="Type sub-skill and press Enter or Add"
          style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1.5px solid #DDE3EE', fontSize: 13 }} />
        <button className="btn btn-outline btn-sm" onClick={go}>Add</button>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
        {subSkills.map(ss => (
          <span key={ss} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, padding: '4px 10px', borderRadius: 20, background: color + '18', color, fontWeight: 600, border: `1px solid ${color}30` }}>
            {ss}
            <button onClick={() => onRemove(ss)} style={{ background: 'none', border: 'none', cursor: 'pointer', color, fontSize: 13, lineHeight: 1, padding: 0 }}>×</button>
          </span>
        ))}
        {subSkills.length === 0 && <span style={{ fontSize: 12, color: '#9CA3AF' }}>No sub-skills added yet.</span>}
      </div>
    </div>
  );
}

const LBL = { fontSize: 12, fontWeight: 700, color: '#445074', display: 'block', marginBottom: 5 };
const INP = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #DDE3EE', fontSize: 13, boxSizing: 'border-box', background: '#FAFBFD' };
