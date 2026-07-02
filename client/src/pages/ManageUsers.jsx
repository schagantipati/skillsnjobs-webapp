import { useEffect, useState, useCallback } from 'react';
import { api } from '../api.js';

const ROLES = [
  { value: '', label: 'All Roles' },
  { value: 'candidate',        label: 'Candidate' },
  { value: 'training_vendor',  label: 'Training Vendor' },
  { value: 'trainer',          label: 'Trainer' },
  { value: 'employer',         label: 'Employer' },
  { value: 'placement_agency', label: 'Placement Agency' },
  { value: 'csr_org',          label: 'CSR Organisation' },
  { value: 'state_government',  label: 'State Government' },
  { value: 'central_government',label: 'Central Government' },
  { value: 'superadmin',        label: 'Super Admin' },
  { value: 'administrator',     label: 'Administrator' },
];

const ROLE_COLORS = {
  candidate:        { bg: '#DBEAFE', color: '#1E40AF' },
  training_vendor:  { bg: '#D1FAE5', color: '#065F46' },
  trainer:          { bg: '#EDE9FE', color: '#5B21B6' },
  employer:         { bg: '#FEF3C7', color: '#92400E' },
  placement_agency: { bg: '#FEE2E2', color: '#991B1B' },
  csr_org:          { bg: '#E0F2FE', color: '#0369A1' },
  superadmin:        { bg: '#0B1E3D', color: '#fff' },
  administrator:     { bg: '#374151', color: '#fff' },
  state_government:  { bg: '#FEF3C7', color: '#92400E' },
  central_government:{ bg: '#DBEAFE', color: '#1E40AF' },
};

function roleLabel(r) {
  return ROLES.find(x => x.value === r)?.label || r;
}

function initials(name = '') {
  const p = name.trim().split(' ');
  return (p[0]?.[0] || '') + (p[1]?.[0] || '');
}

const AVATAR_BG = ['#7C3AED','#0891B2','#D97706','#059669','#DC2626','#2563EB','#0D9488','#D97706'];
function avatarBg(id) { return AVATAR_BG[id % AVATAR_BG.length]; }

export default function ManageUsers() {
  const [users, setUsers]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewUser, setViewUser]   = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [confirm, setConfirm]     = useState(null); // { type:'deactivate'|'activate'|'delete', user }
  const [busy, setBusy]           = useState(false);
  const [toast, setToast]         = useState('');

  const load = useCallback(() => {
    setLoading(true);
    const params = {};
    if (roleFilter)   params.role   = roleFilter;
    if (statusFilter) params.status = statusFilter;
    if (search)       params.search = search;
    api.allUsers(params)
      .then(data => { setUsers(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [roleFilter, statusFilter, search]);

  useEffect(() => { load(); }, [load]);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  function exportCSV() {
    const headers = ['ID','Name','Email','Role','Organisation','Phone','Location','Status','Joined'];
    const rows = users.map(u => [
      u.id,
      u.name,
      u.email,
      roleLabel(u.role),
      u.org_name || '',
      u.phone || '',
      u.location || '',
      u.is_active !== 0 ? 'Active' : 'Inactive',
      u.created_at?.slice(0,10) || '',
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    const dateStr = new Date().toISOString().slice(0,10);
    a.download = `users_export_${dateStr}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Exported ${users.length} users to CSV.`);
  }

  async function handleStatus(user, is_active) {
    setBusy(true);
    try {
      await api.setUserStatus(user.id, is_active);
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_active: is_active ? 1 : 0 } : u));
      if (viewUser?.id === user.id) setViewUser(v => ({ ...v, is_active: is_active ? 1 : 0 }));
      showToast(`${user.name} ${is_active ? 'activated' : 'deactivated'} successfully.`);
    } catch (e) { showToast('Error: ' + e.message); }
    setBusy(false);
    setConfirm(null);
  }

  async function handleDelete(user) {
    setBusy(true);
    try {
      await api.deleteUser(user.id);
      setUsers(prev => prev.filter(u => u.id !== user.id));
      if (viewUser?.id === user.id) setViewUser(null);
      showToast(`${user.name} deleted.`);
    } catch (e) { showToast('Error: ' + e.message); }
    setBusy(false);
    setConfirm(null);
  }

  /* ── counts ── */
  const total    = users.length;
  const active   = users.filter(u => u.is_active !== 0).length;
  const inactive = users.filter(u => u.is_active === 0).length;

  const PILL = (val, cur, set) => ({
    padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700,
    cursor: 'pointer', border: 'none', transition: 'all .15s',
    background: cur === val ? '#0B1E3D' : '#EEF2F8',
    color:      cur === val ? '#fff'    : '#445074',
  });

  const isActive = u => u.is_active !== 0;

  return (
    <div className="page" style={{ maxWidth: 1150, paddingBottom: 40 }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: '#0B1E3D', margin: 0 }}>Manage Users</h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#9CA3AF' }}>View, activate, deactivate, and delete platform users across all roles</p>
      </div>

      {/* ── KPI Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 0, marginBottom: 24, border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' }}>
        {[
          { val: total,    label: 'Total Users',    sub: 'All roles combined',      color: '#1E5FBF' },
          { val: active,   label: 'Active Users',   sub: 'Can log in and use portal', color: '#059669' },
          { val: inactive, label: 'Inactive Users', sub: 'Access suspended',         color: '#D97706' },
        ].map((card, i) => (
          <div key={i} style={{ padding: '20px 28px', background: '#fff', borderRight: i < 2 ? '1px solid #E5E7EB' : 'none', borderTop: `3px solid ${card.color}` }}>
            <div style={{ fontWeight: 900, fontSize: 30, color: card.color, letterSpacing: -1 }}>{card.val.toLocaleString('en-IN')}</div>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#0B1E3D', marginTop: 4 }}>{card.label}</div>
            <div style={{ fontSize: 12, color: card.color, marginTop: 3, fontWeight: 600 }}>{card.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Filters & Search ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
        {/* Status pills */}
        <button style={PILL('', statusFilter, setStatusFilter)} onClick={() => setStatusFilter('')}>All</button>
        <button style={PILL('active', statusFilter, setStatusFilter)} onClick={() => setStatusFilter('active')}>Active</button>
        <button style={PILL('inactive', statusFilter, setStatusFilter)} onClick={() => setStatusFilter('inactive')}>Inactive</button>

        <div style={{ width: 1, height: 24, background: '#E5E7EB', margin: '0 4px' }} />

        {/* Role filter */}
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
          style={{ padding: '6px 12px', borderRadius: 8, border: '1.5px solid #DDE3EE', fontSize: 12, fontWeight: 700, color: '#445074', background: '#F8FAFC', cursor: 'pointer' }}>
          {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>

        {/* Search */}
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, email, org…"
          style={{ padding: '7px 14px', borderRadius: 8, border: '1.5px solid #DDE3EE', fontSize: 13, width: 220, background: '#FAFBFD', marginLeft: 'auto' }} />

        <button onClick={exportCSV} disabled={users.length === 0}
          style={{ padding: '7px 16px', borderRadius: 8, background: '#fff', color: '#059669', fontWeight: 700, fontSize: 13, border: '1.5px solid #6EE7B7', cursor: users.length === 0 ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', opacity: users.length === 0 ? 0.5 : 1 }}>
          ↓ Export CSV
        </button>
        <button onClick={() => setShowAddModal(true)}
          style={{ padding: '7px 18px', borderRadius: 8, background: '#0B1E3D', color: '#fff', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}>
          + Add User
        </button>
      </div>

      {/* ── Table ── */}
      <div className="card shadow" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', minWidth: 860, borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#F8FAFC', borderBottom: '1.5px solid #E5E7EB' }}>
              {['USER','ROLE','EMAIL','JOINED','STATUS','ACTIONS'].map(h => (
                <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 11, fontWeight: 800, color: '#9CA3AF', letterSpacing: 0.6, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={6} style={{ padding: 36, textAlign: 'center', color: '#9CA3AF' }}>Loading users…</td></tr>
            )}
            {!loading && users.length === 0 && (
              <tr><td colSpan={6} style={{ padding: 44, textAlign: 'center', color: '#9CA3AF' }}>No users found.</td></tr>
            )}
            {users.map((u, i) => {
              const active = isActive(u);
              const rc = ROLE_COLORS[u.role] || { bg: '#F1F5F9', color: '#374151' };
              return (
                <tr key={u.id}
                  style={{ borderBottom: '1px solid #F0F2F8', background: i % 2 === 0 ? '#fff' : '#FAFBFD', transition: 'background .1s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#F0F6FF'}
                  onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#FAFBFD'}>

                  {/* User */}
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: active ? avatarBg(u.id) : '#D1D5DB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 12, flexShrink: 0 }}>
                        {initials(u.name)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: '#0B1E3D', fontSize: 13 }}>{u.name}</div>
                        {u.org_name && <div style={{ fontSize: 11, color: '#9CA3AF' }}>{u.org_name}</div>}
                      </div>
                    </div>
                  </td>

                  {/* Role */}
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 6, background: rc.bg, color: rc.color }}>
                      {roleLabel(u.role)}
                    </span>
                  </td>

                  {/* Email */}
                  <td style={{ padding: '12px 16px', color: '#445074', fontSize: 12 }}>{u.email}</td>

                  {/* Joined */}
                  <td style={{ padding: '12px 16px', color: '#9CA3AF', fontSize: 12, whiteSpace: 'nowrap' }}>
                    {u.created_at?.slice(0, 10) || '—'}
                  </td>

                  {/* Status */}
                  <td style={{ padding: '12px 16px' }}>
                    {active
                      ? <span style={{ background: '#ECFDF5', color: '#065F46', fontWeight: 700, fontSize: 11, padding: '3px 10px', borderRadius: 12 }}>Active</span>
                      : <span style={{ background: '#FEF3C7', color: '#92400E', fontWeight: 700, fontSize: 11, padding: '3px 10px', borderRadius: 12 }}>Inactive</span>
                    }
                  </td>

                  {/* Actions */}
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => setViewUser(u)}
                        style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 6, border: '1px solid #DDE3EE', background: 'none', color: '#1E5FBF', cursor: 'pointer' }}>
                        View
                      </button>
                      {active
                        ? <button onClick={() => setConfirm({ type: 'deactivate', user: u })}
                            style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 6, border: '1px solid #FCD34D', background: '#FFFBEB', color: '#92400E', cursor: 'pointer' }}>
                            Deactivate
                          </button>
                        : <button onClick={() => setConfirm({ type: 'activate', user: u })}
                            style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 6, border: '1px solid #6EE7B7', background: '#ECFDF5', color: '#065F46', cursor: 'pointer' }}>
                            Activate
                          </button>
                      }
                      <button onClick={() => setConfirm({ type: 'delete', user: u })}
                        style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 6, border: '1px solid #FECACA', background: '#FEF2F2', color: '#B91C1C', cursor: 'pointer' }}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
        {users.length > 0 && (
          <div style={{ padding: '10px 16px', borderTop: '1px solid #F0F2F8', fontSize: 12, color: '#9CA3AF', background: '#FAFBFD' }}>
            Showing {users.length} user{users.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* ── View Modal ── */}
      {viewUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card shadow" style={{ width: 540, maxWidth: '95vw', padding: 28, position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
            <button onClick={() => setViewUser(null)} style={{ position: 'absolute', top: 14, right: 16, background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#9CA3AF' }}>×</button>

            {/* Header */}
            <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 20 }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: isActive(viewUser) ? avatarBg(viewUser.id) : '#D1D5DB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 18, flexShrink: 0 }}>
                {initials(viewUser.name)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 16, color: '#0B1E3D' }}>{viewUser.name}</div>
                <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{viewUser.email}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                {(() => { const rc = ROLE_COLORS[viewUser.role] || { bg: '#F1F5F9', color: '#374151' };
                  return <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 6, background: rc.bg, color: rc.color }}>{roleLabel(viewUser.role)}</span>;
                })()}
                {isActive(viewUser)
                  ? <span style={{ background: '#ECFDF5', color: '#065F46', fontWeight: 700, fontSize: 11, padding: '3px 10px', borderRadius: 12 }}>Active</span>
                  : <span style={{ background: '#FEF3C7', color: '#92400E', fontWeight: 700, fontSize: 11, padding: '3px 10px', borderRadius: 12 }}>Inactive</span>
                }
              </div>
            </div>

            {/* Fields */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
              {[
                ['Phone',      viewUser.phone || '—'],
                ['Location',   viewUser.location || viewUser.city || '—'],
                ['Org / Inst', viewUser.org_name || '—'],
                ['Experience', viewUser.experience_years ? viewUser.experience_years + ' yrs' : '—'],
                ['Sector',     viewUser.preferred_sector || '—'],
                ['Joined',     viewUser.created_at?.slice(0,10) || '—'],
                ['Last Active','—'],
                ['User ID',    '#' + viewUser.id],
              ].map(([k,v]) => (
                <div key={k} style={{ background: '#F8FAFC', borderRadius: 8, padding: '10px 12px' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 2 }}>{k}</div>
                  <div style={{ fontSize: 13, color: '#0B1E3D', fontWeight: 600 }}>{v}</div>
                </div>
              ))}
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              {isActive(viewUser)
                ? <button onClick={() => setConfirm({ type: 'deactivate', user: viewUser })}
                    style={{ padding: '8px 18px', borderRadius: 8, border: '1.5px solid #FCD34D', background: '#FFFBEB', color: '#92400E', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                    Deactivate
                  </button>
                : <button onClick={() => setConfirm({ type: 'activate', user: viewUser })}
                    style={{ padding: '8px 18px', borderRadius: 8, border: '1.5px solid #6EE7B7', background: '#ECFDF5', color: '#065F46', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                    Activate
                  </button>
              }
              <button onClick={() => setConfirm({ type: 'delete', user: viewUser })}
                style={{ padding: '8px 18px', borderRadius: 8, border: '1.5px solid #FECACA', background: '#FEF2F2', color: '#B91C1C', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm Modal ── */}
      {confirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card shadow" style={{ width: 400, maxWidth: '92vw', padding: 28, textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>
              {confirm.type === 'delete' ? '🗑️' : confirm.type === 'deactivate' ? '⏸️' : '▶️'}
            </div>
            <div style={{ fontWeight: 800, fontSize: 16, color: '#0B1E3D', marginBottom: 8 }}>
              {confirm.type === 'delete'     ? 'Delete User?'
               : confirm.type === 'deactivate' ? 'Deactivate User?'
               : 'Activate User?'}
            </div>
            <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 24, lineHeight: 1.5 }}>
              {confirm.type === 'delete'
                ? <>This will permanently remove <strong>{confirm.user.name}</strong> and cannot be undone.</>
                : confirm.type === 'deactivate'
                ? <><strong>{confirm.user.name}</strong> will lose access to the portal immediately.</>
                : <><strong>{confirm.user.name}</strong> will regain full portal access.</>
              }
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setConfirm(null)} disabled={busy}
                style={{ padding: '9px 22px', borderRadius: 8, border: '1.5px solid #DDE3EE', background: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', color: '#445074' }}>
                Cancel
              </button>
              <button disabled={busy}
                onClick={() => confirm.type === 'delete' ? handleDelete(confirm.user) : handleStatus(confirm.user, confirm.type === 'activate')}
                style={{
                  padding: '9px 22px', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer', border: 'none',
                  background: confirm.type === 'delete' ? '#B91C1C' : confirm.type === 'deactivate' ? '#D97706' : '#059669',
                  color: '#fff', opacity: busy ? 0.7 : 1,
                }}>
                {busy ? 'Please wait…'
                  : confirm.type === 'delete' ? 'Yes, Delete'
                  : confirm.type === 'deactivate' ? 'Deactivate'
                  : 'Activate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add User Modal ── */}
      {showAddModal && (
        <AddUserModal
          onClose={() => setShowAddModal(false)}
          onSaved={newUser => {
            setUsers(prev => [newUser, ...prev]);
            setShowAddModal(false);
            showToast(`${newUser.name} added successfully.`);
          }}
        />
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

/* ── Add User Modal ─────────────────────────────────────────────── */
const ADD_ROLES = [
  { value: 'candidate',         label: 'Candidate' },
  { value: 'training_vendor',   label: 'Training Vendor' },
  { value: 'trainer',           label: 'Trainer' },
  { value: 'employer',          label: 'Employer' },
  { value: 'placement_agency',  label: 'Placement Agency' },
  { value: 'csr_org',           label: 'CSR Organisation' },
  { value: 'state_government',  label: 'State Government' },
  { value: 'central_government',label: 'Central Government' },
  { value: 'administrator',     label: 'Administrator' },
  { value: 'superadmin',        label: 'Super Admin' },
];

function AddUserModal({ onClose, onSaved }) {
  const EMPTY = {
    name: '', email: '', phone: '', role: 'candidate',
    org_name: '', location: '', bio: '', experience_years: '',
    preferred_sector: '', password: '', confirm_password: '',
  };
  const [form, setForm]   = useState(EMPTY);
  const [busy, setBusy]   = useState(false);
  const [err, setErr]     = useState('');
  const [showPw, setShowPw] = useState(false);

  const F = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const INP = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #DDE3EE', fontSize: 13, boxSizing: 'border-box', background: '#FAFBFD' };
  const LBL = { fontSize: 12, fontWeight: 700, color: '#445074', display: 'block', marginBottom: 4 };

  const needsOrg = ['training_vendor','employer','placement_agency','csr_org','administrator'].includes(form.role);

  async function submit() {
    if (!form.name.trim())  return setErr('Full name is required.');
    if (!form.email.trim()) return setErr('Email is required.');
    if (!form.role)         return setErr('Role is required.');
    if (!form.password)     return setErr('Password is required.');
    if (form.password.length < 6) return setErr('Password must be at least 6 characters.');
    if (form.password !== form.confirm_password) return setErr('Passwords do not match.');
    setBusy(true); setErr('');
    try {
      const payload = {
        name: form.name, email: form.email, phone: form.phone,
        role: form.role, org_name: form.org_name, location: form.location,
        bio: form.bio, experience_years: form.experience_years || undefined,
        preferred_sector: form.preferred_sector, password: form.password,
      };
      const res = await api.register(payload);
      onSaved({ ...payload, id: res.user?.id || Date.now(), is_active: 1, created_at: new Date().toISOString() });
    } catch (e) { setErr(e.message); setBusy(false); }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card shadow" style={{ width: 600, maxWidth: '96vw', padding: 28, position: 'relative', maxHeight: '92vh', overflowY: 'auto' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 16, background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#9CA3AF' }}>×</button>

        <div style={{ fontWeight: 900, fontSize: 17, color: '#0B1E3D', marginBottom: 4 }}>Add New User</div>
        <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 22 }}>Create a new user account on the platform</div>

        {/* Role selector — full width, prominent */}
        <div style={{ marginBottom: 16 }}>
          <label style={LBL}>Role *</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 8 }}>
            {ADD_ROLES.map(r => {
              const rc = ROLE_COLORS[r.value] || { bg: '#F1F5F9', color: '#374151' };
              const sel = form.role === r.value;
              return (
                <button key={r.value} type="button" onClick={() => setForm(f => ({ ...f, role: r.value }))}
                  style={{ padding: '8px 6px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: sel ? `2px solid ${rc.color === '#fff' ? '#0B1E3D' : rc.color}` : '1.5px solid #E5E7EB', background: sel ? rc.bg : '#FAFBFD', color: sel ? rc.color : '#6B7280', transition: 'all .15s' }}>
                  {r.label}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ height: 1, background: '#F0F2F8', margin: '16px 0' }} />

        {/* Basic info */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div>
            <label style={LBL}>Full Name *</label>
            <input value={form.name} onChange={F('name')} style={INP} placeholder="e.g. Priya Sharma" />
          </div>
          <div>
            <label style={LBL}>Email Address *</label>
            <input type="email" value={form.email} onChange={F('email')} style={INP} placeholder="user@example.com" />
          </div>
          <div>
            <label style={LBL}>Phone</label>
            <input value={form.phone} onChange={F('phone')} style={INP} placeholder="+91 98765 43210" />
          </div>
          <div>
            <label style={LBL}>Location / City</label>
            <input value={form.location} onChange={F('location')} style={INP} placeholder="e.g. Mumbai" />
          </div>
          {needsOrg && (
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={LBL}>Organisation / Institute Name</label>
              <input value={form.org_name} onChange={F('org_name')} style={INP} placeholder="e.g. TechNova Pvt Ltd" />
            </div>
          )}
          {['candidate','trainer'].includes(form.role) && (
            <>
              <div>
                <label style={LBL}>Preferred Sector</label>
                <input value={form.preferred_sector} onChange={F('preferred_sector')} style={INP} placeholder="e.g. IT, Healthcare" />
              </div>
              <div>
                <label style={LBL}>Experience (years)</label>
                <input type="number" min="0" value={form.experience_years} onChange={F('experience_years')} style={INP} placeholder="0" />
              </div>
            </>
          )}
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={LBL}>Bio / About</label>
            <textarea value={form.bio} onChange={F('bio')} rows={2} style={{ ...INP, resize: 'vertical' }} placeholder="Short description (optional)" />
          </div>
        </div>

        <div style={{ height: 1, background: '#F0F2F8', margin: '4px 0 14px' }} />

        {/* Password */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 6 }}>
          <div>
            <label style={LBL}>Password *</label>
            <div style={{ position: 'relative' }}>
              <input type={showPw ? 'text' : 'password'} value={form.password} onChange={F('password')} style={{ ...INP, paddingRight: 36 }} placeholder="Min. 6 characters" />
              <button type="button" onClick={() => setShowPw(s => !s)}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#9CA3AF' }}>
                {showPw ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
          <div>
            <label style={LBL}>Confirm Password *</label>
            <input type={showPw ? 'text' : 'password'} value={form.confirm_password} onChange={F('confirm_password')} style={INP} placeholder="Re-enter password" />
          </div>
        </div>
        <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 16 }}>Default suggestion: Welcome@123</div>

        {err && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', color: '#B91C1C', fontSize: 13, fontWeight: 600, marginBottom: 14 }}>{err}</div>}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} disabled={busy}
            style={{ padding: '9px 22px', borderRadius: 8, border: '1.5px solid #DDE3EE', background: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', color: '#445074' }}>
            Cancel
          </button>
          <button onClick={submit} disabled={busy}
            style={{ padding: '9px 24px', borderRadius: 8, background: '#0B1E3D', color: '#fff', fontWeight: 700, fontSize: 13, border: 'none', cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.7 : 1 }}>
            {busy ? 'Creating…' : 'Create User'}
          </button>
        </div>
      </div>
    </div>
  );
}
