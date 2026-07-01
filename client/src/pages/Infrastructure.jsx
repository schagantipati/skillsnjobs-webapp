import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api.js';

const PHOTO_TYPES = ['Building', 'Labs', 'Classrooms', 'Practical Labs', 'Reception'];

function Field({ label, children }) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
    </div>
  );
}

function ReadOnly({ label, value }) {
  return (
    <div className="field">
      <label style={{ fontSize: 11, color: 'var(--ink-3)' }}>{label}</label>
      <div style={{ fontSize: 13, color: 'var(--ink-1)', padding: '2px 0', minHeight: 18 }}>
        {value || <span style={{ color: 'var(--ink-3)' }}>—</span>}
      </div>
    </div>
  );
}

function parseArr(v) {
  try { return JSON.parse(v || '[]'); } catch { return []; }
}

function emptyCentre() {
  return {
    name: '', address: '', geo: '',
    classrooms: '', labs: '', workshop: '', seating: '',
    internet: '', power_backup: '', accessibility: '', equipment: '',
    photos: [],
  };
}

export default function Infrastructure() {
  const { user, refresh } = useAuth();

  const [centres, setCentres] = useState(() => {
    const raw = parseArr(user.training_centres);
    if (raw.length === 0) return [{ ...emptyCentre(), _editing: true }];
    return raw.map(c => ({ ...emptyCentre(), ...c, photos: c.photos || [], _editing: false }));
  });
  // snapshots for cancel per centre
  const [snaps, setSnaps] = useState(() => centres.map(c => ({ ...c })));

  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState('');

  function setField(idx, key, val) {
    setCentres(prev => {
      const arr = [...prev];
      arr[idx] = { ...arr[idx], [key]: val };
      return arr;
    });
  }

  function startEdit(idx) {
    setSnaps(prev => { const s = [...prev]; s[idx] = { ...centres[idx] }; return s; });
    setCentres(prev => { const a = [...prev]; a[idx] = { ...a[idx], _editing: true }; return a; });
  }

  function cancelEdit(idx) {
    setCentres(prev => { const a = [...prev]; a[idx] = { ...snaps[idx], _editing: false }; return a; });
  }

  function addCentre() {
    const nc = { ...emptyCentre(), _editing: true };
    setCentres(prev => [...prev, nc]);
    setSnaps(prev => [...prev, { ...nc }]);
  }

  function removeCentre(idx) {
    setCentres(prev => prev.filter((_, i) => i !== idx));
    setSnaps(prev => prev.filter((_, i) => i !== idx));
  }

  function readPhoto(file, centreIdx, label) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      setCentres(prev => {
        const arr = [...prev];
        const photos = arr[centreIdx].photos.filter(p => p.label !== label);
        photos.push({ label, data: ev.target.result, name: file.name });
        arr[centreIdx] = { ...arr[centreIdx], photos };
        return arr;
      });
    };
    reader.readAsDataURL(file);
  }

  function removePhoto(centreIdx, label) {
    setCentres(prev => {
      const arr = [...prev];
      arr[centreIdx] = { ...arr[centreIdx], photos: arr[centreIdx].photos.filter(p => p.label !== label) };
      return arr;
    });
  }

  async function saveAll() {
    // close all edit modes
    setCentres(prev => prev.map(c => ({ ...c, _editing: false })));
    setBusy(true); setErr('');
    try {
      const toSave = centres.map(({ _editing, ...rest }) => rest);
      await api.updateMe({ training_centres: JSON.stringify(toSave), centre_photos: '[]' });
      await refresh();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setErr(e.message || 'Save failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page" style={{ maxWidth: 1100 }}>
      <div className="page-header">
        <h1>Infrastructure</h1>
        <p>Training centres and facility photographs.</p>
      </div>

      {centres.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--ink-3)', fontSize: 14 }}>
          No training centres added yet. Click <strong>+ Add Centre</strong> to begin.
        </div>
      )}

      {centres.map((c, idx) => (
        <div key={idx} className="card shadow" style={{ marginBottom: 24, padding: 0, overflow: 'hidden' }}>

          {/* Centre header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#6B9EF0', padding: '9px 14px', borderBottom: '1px solid #5A8FE8' }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#fff', textTransform: 'uppercase', letterSpacing: 0.4 }}>
              Centre {idx + 1}{c.name ? ` — ${c.name}` : ''}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {!c._editing ? (
                <>
                  <button type="button" onClick={() => startEdit(idx)}
                    style={{ background: '#fff', color: '#6B9EF0', border: '1.5px solid #fff', borderRadius: 7, padding: '3px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                    ✏️ Edit
                  </button>
                  {centres.length > 1 && (
                    <button type="button" onClick={() => removeCentre(idx)}
                      style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.4)', color: '#fff', borderRadius: 7, padding: '3px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                      × Remove
                    </button>
                  )}
                </>
              ) : (
                <>
                  <button type="button" onClick={() => cancelEdit(idx)}
                    style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: '1.5px solid rgba(255,255,255,0.4)', borderRadius: 7, padding: '3px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                    Cancel
                  </button>
                  {centres.length > 1 && (
                    <button type="button" onClick={() => removeCentre(idx)}
                      style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.4)', color: '#fff', borderRadius: 7, padding: '3px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                      × Remove
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          <div style={{ padding: '10px 14px' }}>

            {/* Centre details */}
            <div style={{ marginBottom: 10 }}>
              {c._editing ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
                  <Field label="Centre Name"><input value={c.name} onChange={e => setField(idx,'name',e.target.value)} placeholder="Centre name" /></Field>
                  <Field label="Address"><input value={c.address} onChange={e => setField(idx,'address',e.target.value)} placeholder="Full address" /></Field>
                  <Field label="Geo Location"><input value={c.geo} onChange={e => setField(idx,'geo',e.target.value)} placeholder="Lat, Long or Maps link" /></Field>
                  <Field label="Classrooms"><input value={c.classrooms} onChange={e => setField(idx,'classrooms',e.target.value)} placeholder="No." /></Field>
                  <Field label="Labs"><input value={c.labs} onChange={e => setField(idx,'labs',e.target.value)} placeholder="No." /></Field>
                  <Field label="Seating Capacity"><input value={c.seating} onChange={e => setField(idx,'seating',e.target.value)} placeholder="Total seats" /></Field>
                  <Field label="Workshop Details"><input value={c.workshop} onChange={e => setField(idx,'workshop',e.target.value)} placeholder="Type and capacity" /></Field>
                  <Field label="Equipment"><input value={c.equipment} onChange={e => setField(idx,'equipment',e.target.value)} placeholder="Computers, Projectors…" /></Field>
                  <Field label="Internet Connectivity">
                    <select value={c.internet} onChange={e => setField(idx,'internet',e.target.value)}>
                      <option value="">Select</option><option>Broadband</option><option>Fibre</option><option>4G/LTE</option><option>None</option>
                    </select>
                  </Field>
                  <Field label="Power Backup">
                    <select value={c.power_backup} onChange={e => setField(idx,'power_backup',e.target.value)}>
                      <option value="">Select</option><option>Generator</option><option>UPS</option><option>Solar</option><option>None</option>
                    </select>
                  </Field>
                  <Field label="Accessibility">
                    <select value={c.accessibility} onChange={e => setField(idx,'accessibility',e.target.value)}>
                      <option value="">Select</option><option>Wheelchair accessible</option><option>Ramp available</option><option>Elevator</option><option>Standard</option>
                    </select>
                  </Field>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
                  <ReadOnly label="Centre Name" value={c.name} />
                  <ReadOnly label="Address" value={c.address} />
                  <ReadOnly label="Geo Location" value={c.geo} />
                  <ReadOnly label="Classrooms" value={c.classrooms} />
                  <ReadOnly label="Labs" value={c.labs} />
                  <ReadOnly label="Seating Capacity" value={c.seating} />
                  <ReadOnly label="Workshop" value={c.workshop} />
                  <ReadOnly label="Equipment" value={c.equipment} />
                  <ReadOnly label="Internet" value={c.internet} />
                  <ReadOnly label="Power Backup" value={c.power_backup} />
                  <ReadOnly label="Accessibility" value={c.accessibility} />
                </div>
              )}
            </div>

            {/* Per-centre photos */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-2)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10, borderTop: '1px solid var(--border)', paddingTop: 12 }}>Centre Photographs</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
                {PHOTO_TYPES.map(label => {
                  const existing = c.photos.find(p => p.label === label);
                  return (
                    <div key={label} style={{ textAlign: 'center' }}>
                      <div
                        style={{ width: '100%', paddingBottom: '75%', position: 'relative', borderRadius: 8, overflow: 'hidden', border: existing ? '2px solid #10B981' : '2px dashed var(--border)', background: '#F8FAFC', marginBottom: 5, cursor: c._editing ? 'pointer' : 'default' }}
                        onClick={() => {
                          if (!c._editing) return;
                          const inp = document.createElement('input');
                          inp.type = 'file'; inp.accept = 'image/*';
                          inp.onchange = ev => readPhoto(ev.target.files[0], idx, label);
                          inp.click();
                        }}>
                        {existing
                          ? <img src={existing.data} alt={label} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: 22, color: '#CBD5E1' }}>📷</div>
                        }
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-2)', marginBottom: 2 }}>{label}</div>
                      {existing
                        ? <div style={{ fontSize: 10, color: '#10B981', fontWeight: 600, cursor: c._editing ? 'pointer' : 'default' }} onClick={() => c._editing && removePhoto(idx, label)}>✓ Uploaded{c._editing ? ' · remove' : ''}</div>
                        : <div style={{ fontSize: 10, color: 'var(--ink-3)' }}>{c._editing ? 'Click to upload' : '—'}</div>
                      }
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      ))}

      {centres.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
          {saved && <span style={{ fontSize: 13, color: '#10B981', fontWeight: 700, alignSelf: 'center' }}>✓ Saved</span>}
          {err && <span style={{ fontSize: 13, color: '#EF4444', fontWeight: 600, alignSelf: 'center' }}>{err}</span>}
          <button className="btn btn-outline btn-sm" onClick={addCentre}>+ Add Centre</button>
          <button className="btn btn-primary btn-sm" onClick={saveAll} disabled={busy}>
            {busy ? 'Saving…' : '✓ Save All'}
          </button>
        </div>
      )}
    </div>
  );
}
