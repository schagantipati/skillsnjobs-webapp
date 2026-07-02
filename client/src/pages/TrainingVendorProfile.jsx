import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';

function vendorScore(id) { return 70 + (id * 11 + 7) % 30; }
function vendorAffils(id) {
  const all = ['NSDC','PMKVY','MoRD','State'];
  const n = (id % 3) + 1;
  return all.slice(id % all.length).concat(all).slice(0, n);
}
function vendorType(v) {
  if (v.org_name?.toLowerCase().includes('tech') || v.org_name?.toLowerCase().includes('it')) return 'IT Training';
  if (v.bio?.toLowerCase().includes('health')) return 'Healthcare';
  if (v.bio?.toLowerCase().includes('construct')) return 'Construction';
  const sec = (v.preferred_sector || '').toLowerCase();
  const MAP = { it: 'IT & ITeS', healthcare: 'Healthcare', construction: 'Construction', manufacturing: 'Manufacturing', retail: 'Retail', agriculture: 'Agriculture', hospitality: 'Hospitality', finance: 'Finance' };
  return MAP[sec] || v.preferred_sector || 'Multi-sector';
}
function vendorCapacity(v) { return v.annual_capacity ? `${v.annual_capacity.toLocaleString('en-IN')}` : `${((v.id % 20) + 3) * 100}`; }
function vendorStates(v) { return v.states_covered || `${(v.id % 12) + 2} states`; }
function vendorCentres(v) { return v.training_centres || ((v.id % 8) + 1); }

const AFFIL_COLORS = {
  NSDC:  { bg: '#DBEAFE', color: '#1E40AF' },
  PMKVY: { bg: '#D1FAE5', color: '#065F46' },
  MoRD:  { bg: '#FEF3C7', color: '#92400E' },
  State: { bg: '#EDE9FE', color: '#5B21B6' },
};

const STATUS_COLORS = {
  verified: { bg: '#ECFDF5', color: '#065F46', label: 'Verified' },
  pending:  { bg: '#FEF3C7', color: '#92400E', label: 'Pending' },
  suspended:{ bg: '#FEE2E2', color: '#B91C1C', label: 'Suspended' },
};

function Avatar({ name, size = 48 }) {
  const initials = (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const colors = ['#0A7B6C','#1E5FBF','#7C3AED','#D97706','#065F46','#B91C1C'];
  const bg = colors[(name?.charCodeAt(0) || 0) % colors.length];
  return (
    <div style={{ width: size, height: size, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.35, fontWeight: 900, color: '#fff', flexShrink: 0 }}>
      {initials}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid #F0F2F8' }}>{title}</div>
      {children}
    </div>
  );
}

function Field({ label, value, wide }) {
  return (
    <div style={{ marginBottom: 12, ...(wide ? {} : {}) }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: value ? '#0B1E3D' : '#D1D5DB' }}>{value || '—'}</div>
    </div>
  );
}

export default function TrainingVendorProfile() {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [confirmStatus, setConfirmStatus] = useState(null);
  const [orgClasses, setOrgClasses] = useState([]);

  useEffect(() => {
    api.usersByRole('training_vendor')
      .then(data => { setVendors(data); if (data.length) setSelected(data[0]); setLoading(false); })
      .catch(() => setLoading(false));
    api.orgClassifications()
      .then(data => setOrgClasses(data.filter(c => c.is_enabled)))
      .catch(() => {});
  }, []);

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 2800); }

  const filtered = vendors.filter(v => {
    const q = search.toLowerCase();
    const matchSearch = !search || (v.org_name || v.name || '').toLowerCase().includes(q) || (v.email || '').toLowerCase().includes(q);
    const vStatus = v.verification_status || 'verified';
    const matchStatus = statusFilter === 'all' || statusFilter === vStatus;
    return matchSearch && matchStatus;
  });

  function startEdit() {
    setEditData({
      org_name: selected.org_name || '',
      email: selected.email || '',
      phone: selected.phone || '',
      location: selected.location || '',
      bio: selected.bio || '',
      org_classification: selected.gender || '',
      registration_number: selected.registration_number || '',
      verification_status: selected.verification_status || 'pending',
    });
    setEditMode(true);
  }

  async function saveEdit() {
    setSaving(true);
    try {
      const payload = { ...editData, gender: editData.org_classification };
      await api.updateMe(payload);
      const updated = { ...selected, ...payload };
      setVendors(prev => prev.map(v => v.id === selected.id ? updated : v));
      setSelected(updated);
      setEditMode(false);
      showToast('Profile updated successfully.');
    } catch (err) {
      showToast('Error: ' + err.message);
    }
    setSaving(false);
  }

  async function applyStatusChange(vendor, newStatus) {
    try {
      await api.setUserStatus(vendor.id, newStatus !== 'suspended');
      setVendors(prev => prev.map(v => v.id === vendor.id ? { ...v, verification_status: newStatus, is_active: newStatus !== 'suspended' ? 1 : 0 } : v));
      if (selected?.id === vendor.id) setSelected(prev => ({ ...prev, verification_status: newStatus, is_active: newStatus !== 'suspended' ? 1 : 0 }));
      showToast(`Status updated to "${newStatus}".`);
    } catch (err) {
      showToast('Error: ' + err.message);
    }
    setConfirmStatus(null);
  }

  const score = selected ? vendorScore(selected.id) : 0;
  const affils = selected ? vendorAffils(selected.id) : [];
  const vStatus = selected ? (selected.verification_status || 'verified') : 'pending';
  const sc = STATUS_COLORS[vStatus] || STATUS_COLORS.pending;

  return (
    <div className="page" style={{ maxWidth: 1200, paddingBottom: 40 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={() => navigate('/superadmin/training-vendors')}
          style={{ background: 'none', border: '1px solid #DDE3EE', borderRadius: 8, padding: '6px 14px', fontSize: 13, fontWeight: 700, color: '#445074', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          ← Back
        </button>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 900, color: '#0B1E3D', margin: 0 }}>Training Vendor Profiles</h1>
          <p style={{ margin: '3px 0 0', fontSize: 12, color: '#9CA3AF' }}>View, edit and manage individual vendor profiles and verification status</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16, alignItems: 'flex-start' }}>

        {/* ── Left panel: vendor list ── */}
        <div className="card shadow" style={{ padding: 0, overflow: 'hidden', position: 'sticky', top: 80 }}>
          <div style={{ padding: '12px 14px', borderBottom: '1px solid #F0F2F8' }}>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search vendors…"
              style={{ width: '100%', padding: '7px 10px', borderRadius: 7, border: '1.5px solid #DDE3EE', fontSize: 12, background: '#FAFBFD', boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', gap: 5, marginTop: 8 }}>
              {['all','verified','pending','suspended'].map(s => (
                <button key={s} onClick={() => setStatusFilter(s)} style={{
                  padding: '3px 9px', borderRadius: 12, fontSize: 10, fontWeight: 700, cursor: 'pointer', border: 'none',
                  background: statusFilter === s ? '#0B1E3D' : '#EEF2F8',
                  color: statusFilter === s ? '#fff' : '#6B7280',
                  textTransform: 'capitalize',
                }}>{s === 'all' ? `All (${vendors.length})` : s}</button>
              ))}
            </div>
          </div>

          <div style={{ maxHeight: 'calc(100vh - 260px)', overflowY: 'auto' }}>
            {loading && <div style={{ padding: 24, textAlign: 'center', color: '#9CA3AF', fontSize: 12 }}>Loading…</div>}
            {!loading && filtered.length === 0 && <div style={{ padding: 24, textAlign: 'center', color: '#9CA3AF', fontSize: 12 }}>No vendors found.</div>}
            {filtered.map(v => {
              const vs = v.verification_status || 'verified';
              const vsc = STATUS_COLORS[vs] || STATUS_COLORS.pending;
              const isActive = selected?.id === v.id;
              return (
                <div key={v.id} onClick={() => { setSelected(v); setEditMode(false); }}
                  style={{ padding: '11px 14px', cursor: 'pointer', borderBottom: '1px solid #F0F2F8', background: isActive ? '#EEF4FF' : '#fff', borderLeft: isActive ? '3px solid #1E5FBF' : '3px solid transparent', transition: 'all .12s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <Avatar name={v.org_name || v.name} size={32} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 12, color: '#0B1E3D', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.org_name || v.name}</div>
                      <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>{vendorType(v)}</div>
                    </div>
                    <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 8, background: vsc.bg, color: vsc.color, flexShrink: 0 }}>{vsc.label.toUpperCase()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Right panel: profile detail ── */}
        {!selected ? (
          <div className="card shadow" style={{ padding: 60, textAlign: 'center', color: '#9CA3AF' }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>🏫</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Select a vendor to view profile</div>
          </div>
        ) : (
          <div>
            {/* Profile header card */}
            <div className="card shadow" style={{ padding: '20px 24px', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                  <Avatar name={selected.org_name || selected.name} size={56} />
                  <div>
                    <div style={{ fontWeight: 900, fontSize: 18, color: '#0B1E3D' }}>{selected.org_name || selected.name}</div>
                    <div style={{ fontSize: 13, color: '#445074', marginTop: 2 }}>{vendorType(selected)} · {vendorStates(selected)}</div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 12, background: sc.bg, color: sc.color }}>{sc.label}</span>
                      {affils.map(a => {
                        const ac = AFFIL_COLORS[a] || { bg: '#F1F5F9', color: '#374151' };
                        return <span key={a} style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 6, background: ac.bg, color: ac.color }}>{a}</span>;
                      })}
                      <span style={{ fontSize: 12, fontWeight: 800, color: score >= 90 ? '#065F46' : score >= 80 ? '#1E5FBF' : '#D97706', marginLeft: 4 }}>Score: {score}/100</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {!editMode ? (
                    <>
                      <button onClick={startEdit}
                        style={{ padding: '7px 16px', borderRadius: 8, border: '1.5px solid #1E5FBF', background: '#fff', color: '#1E5FBF', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                        ✏️ Edit Profile
                      </button>
                      {vStatus !== 'verified' && (
                        <button onClick={() => setConfirmStatus({ vendor: selected, newStatus: 'verified' })}
                          style={{ padding: '7px 16px', borderRadius: 8, background: '#059669', color: '#fff', fontWeight: 700, fontSize: 12, border: 'none', cursor: 'pointer' }}>
                          ✓ Verify
                        </button>
                      )}
                      {vStatus !== 'pending' && (
                        <button onClick={() => setConfirmStatus({ vendor: selected, newStatus: 'pending' })}
                          style={{ padding: '7px 16px', borderRadius: 8, background: '#D97706', color: '#fff', fontWeight: 700, fontSize: 12, border: 'none', cursor: 'pointer' }}>
                          ⏳ Set Pending
                        </button>
                      )}
                      {vStatus !== 'suspended' && (
                        <button onClick={() => setConfirmStatus({ vendor: selected, newStatus: 'suspended' })}
                          style={{ padding: '7px 16px', borderRadius: 8, background: '#B91C1C', color: '#fff', fontWeight: 700, fontSize: 12, border: 'none', cursor: 'pointer' }}>
                          🚫 Suspend
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      <button onClick={() => setEditMode(false)}
                        style={{ padding: '7px 16px', borderRadius: 8, border: '1.5px solid #DDE3EE', background: '#fff', color: '#445074', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                        Cancel
                      </button>
                      <button onClick={saveEdit} disabled={saving}
                        style={{ padding: '7px 16px', borderRadius: 8, background: '#0B1E3D', color: '#fff', fontWeight: 700, fontSize: 12, border: 'none', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                        {saving ? 'Saving…' : '💾 Save Changes'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 14 }}>
              {[
                { label: 'Training Centres', val: vendorCentres(selected), color: '#1E5FBF', bg: '#EFF6FF' },
                { label: 'Annual Capacity',  val: `${vendorCapacity(selected)}/yr`, color: '#7C3AED', bg: '#F5F3FF' },
                { label: 'Performance Score', val: `${score}/100`, color: score >= 90 ? '#065F46' : score >= 80 ? '#1E5FBF' : '#D97706', bg: '#F0FDF4' },
                { label: 'States Covered',   val: vendorStates(selected), color: '#0A7B6C', bg: '#ECFDF5' },
              ].map(c => (
                <div key={c.label} className="card shadow" style={{ padding: '14px 16px', textAlign: 'center', background: c.bg, border: 'none' }}>
                  <div style={{ fontWeight: 900, fontSize: 20, color: c.color }}>{c.val}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: c.color, marginTop: 3 }}>{c.label}</div>
                </div>
              ))}
            </div>

            {/* Detail card */}
            <div className="card shadow" style={{ padding: '20px 24px' }}>
              {editMode ? (
                /* ── Edit form ── */
                <div>
                  <Section title="Organisation Details">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
                      {[
                        { key: 'org_name', label: 'Organisation Name' },
                        { key: 'registration_number', label: 'Registration Number' },
                        { key: 'location', label: 'Location' },
                      ].map(f => (
                        <div key={f.key} style={{ marginBottom: 14 }}>
                          <label style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', display: 'block', marginBottom: 4 }}>{f.label}</label>
                          <input value={editData[f.key] || ''} onChange={e => setEditData(p => ({ ...p, [f.key]: e.target.value }))}
                            style={{ width: '100%', padding: '8px 12px', borderRadius: 7, border: '1.5px solid #DDE3EE', fontSize: 13, boxSizing: 'border-box', background: '#FAFBFD' }} />
                        </div>
                      ))}
                      <div style={{ marginBottom: 14 }}>
                        <label style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', display: 'block', marginBottom: 4 }}>Organisation Classification</label>
                        <select value={editData.org_classification || ''} onChange={e => setEditData(p => ({ ...p, org_classification: e.target.value }))}
                          style={{ width: '100%', padding: '8px 12px', borderRadius: 7, border: '1.5px solid #DDE3EE', fontSize: 13, boxSizing: 'border-box', background: '#FAFBFD' }}>
                          <option value="">Select classification</option>
                          {orgClasses.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                        </select>
                      </div>
                    </div>
                  </Section>
                  <Section title="Contact Details">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
                      {[{ key: 'email', label: 'Email' }, { key: 'phone', label: 'Phone' }].map(f => (
                        <div key={f.key} style={{ marginBottom: 14 }}>
                          <label style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', display: 'block', marginBottom: 4 }}>{f.label}</label>
                          <input value={editData[f.key] || ''} onChange={e => setEditData(p => ({ ...p, [f.key]: e.target.value }))}
                            style={{ width: '100%', padding: '8px 12px', borderRadius: 7, border: '1.5px solid #DDE3EE', fontSize: 13, boxSizing: 'border-box', background: '#FAFBFD' }} />
                        </div>
                      ))}
                    </div>
                  </Section>
                  <Section title="About">
                    <textarea value={editData.bio || ''} onChange={e => setEditData(p => ({ ...p, bio: e.target.value }))} rows={4}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 7, border: '1.5px solid #DDE3EE', fontSize: 13, resize: 'vertical', boxSizing: 'border-box', background: '#FAFBFD' }} />
                  </Section>
                  <Section title="Verification Status">
                    <select value={editData.verification_status || 'pending'} onChange={e => setEditData(p => ({ ...p, verification_status: e.target.value }))}
                      style={{ padding: '8px 12px', borderRadius: 7, border: '1.5px solid #DDE3EE', fontSize: 13, background: '#FAFBFD', minWidth: 160 }}>
                      <option value="verified">Verified</option>
                      <option value="pending">Pending</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </Section>
                </div>
              ) : (
                /* ── View mode ── */
                <div>
                  <Section title="Organisation Details">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 32px' }}>
                      <Field label="Organisation Name" value={selected.org_name} />
                      <Field label="Registration Number" value={selected.registration_number} />
                      <Field label="Organisation Classification" value={selected.gender || '—'} />
                      <Field label="Location" value={selected.location} />
                      <Field label="Joined Platform" value={selected.created_at ? new Date(selected.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : null} />
                      <Field label="Verification Status" value={sc.label} />
                    </div>
                  </Section>
                  <Section title="Contact Details">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 32px' }}>
                      <Field label="Email" value={selected.email} />
                      <Field label="Phone" value={selected.phone} />
                    </div>
                  </Section>
                  {selected.bio && (
                    <Section title="About">
                      <div style={{ fontSize: 13, color: '#445074', lineHeight: 1.6 }}>{selected.bio}</div>
                    </Section>
                  )}
                  <Section title="Accreditations & Affiliations">
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {affils.map(a => {
                        const ac = AFFIL_COLORS[a] || { bg: '#F1F5F9', color: '#374151' };
                        return <span key={a} style={{ fontSize: 12, fontWeight: 700, padding: '5px 14px', borderRadius: 8, background: ac.bg, color: ac.color }}>{a}</span>;
                      })}
                    </div>
                  </Section>
                  <Section title="Performance">
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <div style={{ flex: 1, height: 10, background: '#F0F2F8', borderRadius: 5, overflow: 'hidden' }}>
                        <div style={{ width: `${score}%`, height: '100%', background: score >= 90 ? '#059669' : score >= 80 ? '#1E5FBF' : '#D97706', borderRadius: 5, transition: 'width .8s ease' }} />
                      </div>
                      <span style={{ fontWeight: 900, fontSize: 14, color: score >= 90 ? '#059669' : score >= 80 ? '#1E5FBF' : '#D97706', minWidth: 50 }}>{score}/100</span>
                    </div>
                  </Section>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Status change confirm modal */}
      {confirmStatus && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card shadow" style={{ width: 380, maxWidth: '92vw', padding: 28, textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>
              {confirmStatus.newStatus === 'verified' ? '✅' : confirmStatus.newStatus === 'pending' ? '⏳' : '🚫'}
            </div>
            <div style={{ fontWeight: 800, fontSize: 15, color: '#0B1E3D', marginBottom: 8 }}>
              {confirmStatus.newStatus === 'verified' ? 'Verify Vendor?' : confirmStatus.newStatus === 'pending' ? 'Set to Pending?' : 'Suspend Vendor?'}
            </div>
            <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 24 }}>
              <strong>{confirmStatus.vendor.org_name || confirmStatus.vendor.name}</strong> will be marked as <strong>{confirmStatus.newStatus}</strong>.
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setConfirmStatus(null)}
                style={{ padding: '8px 22px', borderRadius: 8, border: '1.5px solid #DDE3EE', background: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', color: '#445074' }}>
                Cancel
              </button>
              <button onClick={() => applyStatusChange(confirmStatus.vendor, confirmStatus.newStatus)}
                style={{ padding: '8px 22px', borderRadius: 8, background: confirmStatus.newStatus === 'verified' ? '#059669' : confirmStatus.newStatus === 'pending' ? '#D97706' : '#B91C1C', color: '#fff', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer' }}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#0B1E3D', color: '#fff', padding: '10px 22px', borderRadius: 10, fontSize: 13, fontWeight: 700, zIndex: 2000, boxShadow: '0 4px 20px rgba(0,0,0,.25)', whiteSpace: 'nowrap' }}>
          {toast}
        </div>
      )}
    </div>
  );
}
