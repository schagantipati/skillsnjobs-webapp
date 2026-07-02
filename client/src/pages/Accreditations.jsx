import { useEffect, useState } from 'react';
import { api } from '../api.js';

export default function Accreditations() {
  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [filter, setFilter]     = useState('all');
  const [newName, setNewName]   = useState('');
  const [adding, setAdding]     = useState(false);
  const [addErr, setAddErr]     = useState('');
  const [editId, setEditId]     = useState(null);
  const [editName, setEditName] = useState('');
  const [toast, setToast]       = useState('');
  const [confirmDel, setConfirmDel] = useState(null);
  const [busy, setBusy]         = useState(false);

  useEffect(() => {
    api.accreditations()
      .then(d => { setItems(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 2800); }

  const filtered = items.filter(it => {
    const matchSearch = !search || it.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || (filter === 'enabled' ? it.is_enabled : !it.is_enabled);
    return matchSearch && matchFilter;
  });

  const enabledCount  = items.filter(i => i.is_enabled).length;
  const disabledCount = items.filter(i => !i.is_enabled).length;

  async function handleAdd(e) {
    e.preventDefault();
    if (!newName.trim()) return setAddErr('Required.');
    setAdding(true); setAddErr('');
    try {
      const row = await api.addAccreditation(newName.trim());
      setItems(prev => [...prev, row]);
      setNewName('');
      showToast(`"${row.name}" added.`);
    } catch (err) { setAddErr(err.message); }
    setAdding(false);
  }

  async function handleToggle(item) {
    const next = !item.is_enabled;
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_enabled: next ? 1 : 0 } : i));
    try {
      await api.setAccreditationStatus(item.id, next);
      showToast(`"${item.name}" ${next ? 'enabled' : 'disabled'}.`);
    } catch (err) {
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_enabled: item.is_enabled } : i));
      showToast('Error: ' + err.message);
    }
  }

  async function handleRename(item) {
    if (!editName.trim() || editName.trim() === item.name) { setEditId(null); return; }
    setBusy(true);
    try {
      const updated = await api.renameAccreditation(item.id, editName.trim());
      setItems(prev => prev.map(i => i.id === item.id ? updated : i));
      showToast(`Renamed to "${updated.name}".`);
    } catch (err) { showToast('Error: ' + err.message); }
    setEditId(null); setBusy(false);
  }

  async function handleDelete(item) {
    setBusy(true);
    try {
      await api.deleteAccreditation(item.id);
      setItems(prev => prev.filter(i => i.id !== item.id));
      showToast(`"${item.name}" deleted.`);
    } catch (err) { showToast('Error: ' + err.message); }
    setConfirmDel(null); setBusy(false);
  }

  const PILL = (val, label) => (
    <button key={val} onClick={() => setFilter(val)} style={{
      padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700,
      cursor: 'pointer', border: 'none',
      background: filter === val ? '#0B1E3D' : '#EEF2F8',
      color:      filter === val ? '#fff'    : '#6B7280',
    }}>{label}</button>
  );

  return (
    <div className="page" style={{ maxWidth: 780, paddingBottom: 40 }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 19, fontWeight: 900, color: '#0B1E3D', margin: 0 }}>Accreditations & Empanelment</h1>
          <p style={{ margin: '3px 0 0', fontSize: 12, color: '#9CA3AF' }}>
            Useful for government verification. Supporting documents can be uploaded against each type.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          {[
            { label: 'Total',    val: items.length,  bg: '#EEF2F8', color: '#1E5FBF' },
            { label: 'Enabled',  val: enabledCount,  bg: '#ECFDF5', color: '#059669' },
            { label: 'Disabled', val: disabledCount, bg: '#FEF3C7', color: '#D97706' },
          ].map(c => (
            <div key={c.label} style={{ background: c.bg, borderRadius: 8, padding: '6px 14px', textAlign: 'center', minWidth: 58 }}>
              <div style={{ fontWeight: 900, fontSize: 18, color: c.color, lineHeight: 1 }}>{c.val}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: c.color, marginTop: 2 }}>{c.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Info banner ── */}
      <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, padding: '8px 14px', marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
        <span style={{ fontSize: 14 }}>🏛️</span>
        <span style={{ fontSize: 12, color: '#1E40AF', fontWeight: 600 }}>
          These accreditation types appear as selectable options when training vendors and organisations submit their profile and supporting documents.
        </span>
      </div>

      {/* ── Add + Filter bar ── */}
      <div className="card shadow" style={{ padding: '12px 16px', marginBottom: 14 }}>
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: 8, marginBottom: addErr ? 6 : 10 }}>
          <input
            value={newName}
            onChange={e => { setNewName(e.target.value); setAddErr(''); }}
            placeholder="Add new accreditation type (e.g. FSSAI Certification)…"
            style={{ flex: 1, padding: '7px 12px', borderRadius: 7, border: `1.5px solid ${addErr ? '#FECACA' : '#DDE3EE'}`, fontSize: 13, background: '#FAFBFD' }}
          />
          <button type="submit" disabled={adding} style={{
            padding: '7px 18px', borderRadius: 7, background: '#0B1E3D', color: '#fff',
            fontWeight: 700, fontSize: 12, border: 'none', cursor: adding ? 'not-allowed' : 'pointer',
            opacity: adding ? 0.7 : 1, whiteSpace: 'nowrap',
          }}>
            {adding ? '…' : '+ Add'}
          </button>
        </form>
        {addErr && <div style={{ fontSize: 11, color: '#B91C1C', marginBottom: 8 }}>{addErr}</div>}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {PILL('all',      `All (${items.length})`)}
          {PILL('enabled',  `Enabled (${enabledCount})`)}
          {PILL('disabled', `Disabled (${disabledCount})`)}
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search…"
            style={{ marginLeft: 'auto', padding: '5px 10px', borderRadius: 7, border: '1.5px solid #DDE3EE', fontSize: 12, width: 170, background: '#FAFBFD' }} />
        </div>
      </div>

      {/* ── Cards grid ── */}
      {loading && <div style={{ textAlign: 'center', color: '#9CA3AF', padding: 32, fontSize: 13 }}>Loading…</div>}
      {!loading && filtered.length === 0 && (
        <div style={{ textAlign: 'center', color: '#9CA3AF', padding: 40, fontSize: 13 }}>
          {items.length === 0 ? 'No accreditations yet.' : 'Nothing matches your filter.'}
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {filtered.map(item => (
            <div key={item.id} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 14px', borderRadius: 10,
              background: item.is_enabled ? '#fff' : '#FAFAFA',
              border: `1.5px solid ${item.is_enabled ? '#E5E7EB' : '#F0F0F0'}`,
              boxShadow: item.is_enabled ? '0 1px 4px rgba(0,0,0,.06)' : 'none',
              opacity: item.is_enabled ? 1 : 0.65,
              transition: 'all .15s',
            }}>

              {/* Toggle switch */}
              <div onClick={() => handleToggle(item)}
                title={item.is_enabled ? 'Click to disable' : 'Click to enable'}
                style={{ width: 36, height: 20, borderRadius: 10, cursor: 'pointer', flexShrink: 0,
                  position: 'relative', transition: 'background .2s',
                  background: item.is_enabled ? '#059669' : '#D1D5DB' }}>
                <div style={{ position: 'absolute', top: 2, left: item.is_enabled ? 18 : 2,
                  width: 16, height: 16, borderRadius: '50%', background: '#fff',
                  transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.2)' }} />
              </div>

              {/* Name */}
              <div style={{ flex: 1, minWidth: 0 }}>
                {editId === item.id ? (
                  <input autoFocus value={editName}
                    onChange={e => setEditName(e.target.value)}
                    onBlur={() => handleRename(item)}
                    onKeyDown={e => { if (e.key === 'Enter') handleRename(item); if (e.key === 'Escape') setEditId(null); }}
                    style={{ width: '100%', padding: '3px 8px', borderRadius: 5, border: '1.5px solid #93C5FD', fontSize: 12, fontWeight: 600 }}
                  />
                ) : (
                  <div style={{ fontSize: 13, fontWeight: 700,
                    color: item.is_enabled ? '#0B1E3D' : '#9CA3AF',
                    textDecoration: item.is_enabled ? 'none' : 'line-through',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.name}
                  </div>
                )}
              </div>

              {/* SYS / USR badge */}
              <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 4, flexShrink: 0,
                background: item.is_system ? '#DBEAFE' : '#F1F5F9',
                color:      item.is_system ? '#1E40AF'  : '#94A3B8' }}>
                {item.is_system ? 'SYS' : 'USR'}
              </span>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                {!item.is_system && editId !== item.id && (
                  <button onClick={() => { setEditId(item.id); setEditName(item.name); }}
                    title="Rename"
                    style={{ width: 26, height: 26, borderRadius: 6, border: '1px solid #E5E7EB', background: '#F8FAFC', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    ✏️
                  </button>
                )}
                {!item.is_system && (
                  <button onClick={() => setConfirmDel(item)}
                    title="Delete"
                    style={{ width: 26, height: 26, borderRadius: 6, border: '1px solid #FECACA', background: '#FEF2F2', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    🗑
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {filtered.length > 0 && (
        <div style={{ marginTop: 10, fontSize: 11, color: '#9CA3AF', textAlign: 'right' }}>
          {filtered.length} of {items.length} accreditation types
        </div>
      )}

      {/* ── Delete Confirm ── */}
      {confirmDel && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card shadow" style={{ width: 360, maxWidth: '92vw', padding: 24, textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🗑️</div>
            <div style={{ fontWeight: 800, fontSize: 15, color: '#0B1E3D', marginBottom: 6 }}>Delete Accreditation Type?</div>
            <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 20 }}>
              "<strong>{confirmDel.name}</strong>" will be permanently removed.
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <button onClick={() => setConfirmDel(null)} disabled={busy}
                style={{ padding: '8px 20px', borderRadius: 7, border: '1.5px solid #DDE3EE', background: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', color: '#445074' }}>
                Cancel
              </button>
              <button onClick={() => handleDelete(confirmDel)} disabled={busy}
                style={{ padding: '8px 20px', borderRadius: 7, background: '#B91C1C', color: '#fff', fontWeight: 700, fontSize: 13, border: 'none', cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.7 : 1 }}>
                {busy ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#0B1E3D', color: '#fff', padding: '10px 22px', borderRadius: 10, fontSize: 13, fontWeight: 700, zIndex: 2000, boxShadow: '0 4px 20px rgba(0,0,0,.25)', whiteSpace: 'nowrap' }}>
          {toast}
        </div>
      )}
    </div>
  );
}
