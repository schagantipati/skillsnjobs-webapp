import { useEffect, useState } from 'react';
import { api } from '../api.js';

export default function OrgClassifications() {
  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [filter, setFilter]     = useState('all'); // all | enabled | disabled
  const [newName, setNewName]   = useState('');
  const [adding, setAdding]     = useState(false);
  const [addErr, setAddErr]     = useState('');
  const [editId, setEditId]     = useState(null);
  const [editName, setEditName] = useState('');
  const [toast, setToast]       = useState('');
  const [confirmDel, setConfirmDel] = useState(null);
  const [busy, setBusy]         = useState(false);

  useEffect(() => {
    api.orgClassifications()
      .then(data => { setItems(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 3000); }

  /* ── filtered list ── */
  const filtered = items.filter(it => {
    const matchSearch = !search || it.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || (filter === 'enabled' ? it.is_enabled : !it.is_enabled);
    return matchSearch && matchFilter;
  });

  const enabledCount  = items.filter(i => i.is_enabled).length;
  const disabledCount = items.filter(i => !i.is_enabled).length;

  /* ── add ── */
  async function handleAdd(e) {
    e.preventDefault();
    if (!newName.trim()) return setAddErr('Name is required.');
    setAdding(true); setAddErr('');
    try {
      const row = await api.addOrgClassification(newName.trim());
      setItems(prev => [...prev, row]);
      setNewName('');
      showToast(`"${row.name}" added successfully.`);
    } catch (err) { setAddErr(err.message); }
    setAdding(false);
  }

  /* ── toggle status ── */
  async function handleToggle(item) {
    const newStatus = !item.is_enabled;
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_enabled: newStatus ? 1 : 0 } : i));
    try {
      await api.setOrgClassificationStatus(item.id, newStatus);
      showToast(`"${item.name}" ${newStatus ? 'enabled' : 'disabled'}.`);
    } catch (err) {
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_enabled: item.is_enabled } : i));
      showToast('Error: ' + err.message);
    }
  }

  /* ── rename ── */
  async function handleRename(item) {
    if (!editName.trim() || editName.trim() === item.name) { setEditId(null); return; }
    setBusy(true);
    try {
      const updated = await api.renameOrgClassification(item.id, editName.trim());
      setItems(prev => prev.map(i => i.id === item.id ? updated : i));
      showToast(`Renamed to "${updated.name}".`);
    } catch (err) { showToast('Error: ' + err.message); }
    setEditId(null); setBusy(false);
  }

  /* ── delete ── */
  async function handleDelete(item) {
    setBusy(true);
    try {
      await api.deleteOrgClassification(item.id);
      setItems(prev => prev.filter(i => i.id !== item.id));
      showToast(`"${item.name}" deleted.`);
    } catch (err) { showToast('Error: ' + err.message); }
    setConfirmDel(null); setBusy(false);
  }

  const PILL = val => ({
    padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700,
    cursor: 'pointer', border: 'none', transition: 'all .15s',
    background: filter === val ? '#0B1E3D' : '#EEF2F8',
    color:      filter === val ? '#fff'    : '#445074',
  });

  return (
    <div className="page" style={{ maxWidth: 860, paddingBottom: 48 }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: '#0B1E3D', margin: 0 }}>Organisation Classifications</h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#9CA3AF' }}>
          Predefined types used when defining organisations across the platform. Enable or disable values as needed.
        </p>
      </div>

      {/* ── KPI strip ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 0, marginBottom: 24, border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' }}>
        {[
          { val: items.length,   label: 'Total Classifications', color: '#1E5FBF', borderRight: true },
          { val: enabledCount,   label: 'Enabled',               color: '#059669', borderRight: true },
          { val: disabledCount,  label: 'Disabled',              color: '#D97706', borderRight: false },
        ].map((c, i) => (
          <div key={i} style={{ padding: '18px 24px', background: '#fff', borderRight: c.borderRight ? '1px solid #E5E7EB' : 'none', borderTop: `3px solid ${c.color}` }}>
            <div style={{ fontWeight: 900, fontSize: 28, color: c.color }}>{c.val}</div>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#0B1E3D', marginTop: 3 }}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* ── Add new classification ── */}
      <div className="card shadow" style={{ padding: '20px 24px', marginBottom: 20 }}>
        <div style={{ fontWeight: 800, fontSize: 14, color: '#0B1E3D', marginBottom: 12 }}>+ Add New Classification</div>
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <input
              value={newName}
              onChange={e => { setNewName(e.target.value); setAddErr(''); }}
              placeholder="e.g. Skill Development Institute"
              style={{ width: '100%', padding: '9px 14px', borderRadius: 8, border: `1.5px solid ${addErr ? '#FECACA' : '#DDE3EE'}`, fontSize: 13, background: '#FAFBFD', boxSizing: 'border-box' }}
            />
            {addErr && <div style={{ fontSize: 12, color: '#B91C1C', marginTop: 4 }}>{addErr}</div>}
          </div>
          <button type="submit" disabled={adding}
            style={{ padding: '9px 22px', borderRadius: 8, background: '#0B1E3D', color: '#fff', fontWeight: 700, fontSize: 13, border: 'none', cursor: adding ? 'not-allowed' : 'pointer', opacity: adding ? 0.7 : 1, whiteSpace: 'nowrap' }}>
            {adding ? 'Adding…' : 'Add Classification'}
          </button>
        </form>
      </div>

      {/* ── Filters + Search ── */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 14, flexWrap: 'wrap' }}>
        <button style={PILL('all')}      onClick={() => setFilter('all')}>All ({items.length})</button>
        <button style={PILL('enabled')}  onClick={() => setFilter('enabled')}>Enabled ({enabledCount})</button>
        <button style={PILL('disabled')} onClick={() => setFilter('disabled')}>Disabled ({disabledCount})</button>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search classifications…"
          style={{ marginLeft: 'auto', padding: '6px 14px', borderRadius: 8, border: '1.5px solid #DDE3EE', fontSize: 13, width: 220, background: '#FAFBFD' }} />
      </div>

      {/* ── List ── */}
      <div className="card shadow" style={{ padding: 0, overflow: 'hidden' }}>
        {loading && <div style={{ padding: 36, textAlign: 'center', color: '#9CA3AF' }}>Loading…</div>}
        {!loading && filtered.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>
            {items.length === 0 ? 'No classifications yet.' : 'No results match your filter.'}
          </div>
        )}

        {filtered.map((item, i) => (
          <div key={item.id}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderBottom: i < filtered.length - 1 ? '1px solid #F0F2F8' : 'none', background: i % 2 === 0 ? '#fff' : '#FAFBFD', transition: 'background .1s' }}
            onMouseEnter={e => e.currentTarget.style.background = '#F5F8FF'}
            onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#FAFBFD'}>

            {/* Sort number */}
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#EEF2F8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#9CA3AF', flexShrink: 0 }}>
              {item.sort_order}
            </div>

            {/* Name — editable inline */}
            <div style={{ flex: 1 }}>
              {editId === item.id ? (
                <input
                  autoFocus
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  onBlur={() => handleRename(item)}
                  onKeyDown={e => { if (e.key === 'Enter') handleRename(item); if (e.key === 'Escape') setEditId(null); }}
                  style={{ padding: '5px 10px', borderRadius: 6, border: '1.5px solid #93C5FD', fontSize: 13, fontWeight: 600, width: '100%', maxWidth: 340 }}
                />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: item.is_enabled ? '#0B1E3D' : '#9CA3AF', textDecoration: item.is_enabled ? 'none' : 'line-through' }}>
                    {item.name}
                  </span>
                  {item.is_system ? (
                    <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 6, background: '#EDE9FE', color: '#5B21B6' }}>System</span>
                  ) : (
                    <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 6, background: '#F1F5F9', color: '#64748B' }}>Custom</span>
                  )}
                </div>
              )}
            </div>

            {/* Status badge */}
            <div style={{ flexShrink: 0 }}>
              {item.is_enabled
                ? <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 12, background: '#ECFDF5', color: '#065F46' }}>Enabled</span>
                : <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 12, background: '#FEF3C7', color: '#92400E' }}>Disabled</span>
              }
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              {/* Toggle */}
              <button
                onClick={() => handleToggle(item)}
                title={item.is_enabled ? 'Disable' : 'Enable'}
                style={{ padding: '5px 12px', borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: 'none', transition: 'all .15s',
                  background: item.is_enabled ? '#FEF3C7' : '#ECFDF5',
                  color:      item.is_enabled ? '#92400E' : '#065F46' }}>
                {item.is_enabled ? 'Disable' : 'Enable'}
              </button>

              {/* Edit (custom only) */}
              {!item.is_system && editId !== item.id && (
                <button
                  onClick={() => { setEditId(item.id); setEditName(item.name); }}
                  style={{ padding: '5px 12px', borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: '1px solid #DDE3EE', background: '#fff', color: '#1E5FBF' }}>
                  Rename
                </button>
              )}

              {/* Delete (custom only) */}
              {!item.is_system && (
                <button
                  onClick={() => setConfirmDel(item)}
                  style={{ padding: '5px 10px', borderRadius: 7, fontSize: 13, cursor: 'pointer', border: '1px solid #FECACA', background: '#FEF2F2', color: '#B91C1C', lineHeight: 1 }}>
                  🗑
                </button>
              )}
            </div>
          </div>
        ))}

        {filtered.length > 0 && (
          <div style={{ padding: '10px 20px', borderTop: '1px solid #F0F2F8', fontSize: 12, color: '#9CA3AF', background: '#FAFBFD' }}>
            Showing {filtered.length} of {items.length} classifications
          </div>
        )}
      </div>

      {/* ── Delete Confirm ── */}
      {confirmDel && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card shadow" style={{ width: 380, maxWidth: '92vw', padding: 28, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>🗑️</div>
            <div style={{ fontWeight: 800, fontSize: 16, color: '#0B1E3D', marginBottom: 8 }}>Delete Classification?</div>
            <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 22, lineHeight: 1.6 }}>
              "<strong>{confirmDel.name}</strong>" will be permanently removed. This cannot be undone.
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setConfirmDel(null)} disabled={busy}
                style={{ padding: '9px 22px', borderRadius: 8, border: '1.5px solid #DDE3EE', background: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', color: '#445074' }}>
                Cancel
              </button>
              <button onClick={() => handleDelete(confirmDel)} disabled={busy}
                style={{ padding: '9px 22px', borderRadius: 8, background: '#B91C1C', color: '#fff', fontWeight: 700, fontSize: 13, border: 'none', cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.7 : 1 }}>
                {busy ? 'Deleting…' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)', background: '#0B1E3D', color: '#fff', padding: '11px 24px', borderRadius: 10, fontSize: 13, fontWeight: 700, zIndex: 2000, boxShadow: '0 4px 20px rgba(0,0,0,.25)', whiteSpace: 'nowrap' }}>
          {toast}
        </div>
      )}
    </div>
  );
}
