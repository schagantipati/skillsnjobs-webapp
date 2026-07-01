import { useState } from 'react';

const ROLES = [
  { key: 'superadmin',        label: 'Super Admin',       short: 'SA',  color: '#7C3AED' },
  { key: 'administrator',     label: 'Admin',             short: 'ADM', color: '#1E5FBF' },
  { key: 'state_government',  label: 'State Govt',        short: 'SG',  color: '#0A7B6C' },
  { key: 'central_government',label: 'Central Govt',      short: 'CG',  color: '#065F46' },
  { key: 'employer',          label: 'Employer',          short: 'EMP', color: '#0891B2' },
  { key: 'training_vendor',   label: 'Training Vendor',   short: 'TV',  color: '#B45309' },
  { key: 'trainer',           label: 'Trainer',           short: 'TRN', color: '#6D28D9' },
  { key: 'placement_agency',  label: 'Placement Agency',  short: 'PA',  color: '#C0392B' },
  { key: 'csr_org',           label: 'CSR Org',           short: 'CSR', color: '#D97706' },
  { key: 'candidate',         label: 'Candidate',         short: 'CND', color: '#374151' },
];

const GROUPS = [
  {
    label: 'Platform Management',
    icon: '🛡️',
    color: '#7C3AED',
    perms: [
      { key: 'platform_settings', label: 'Platform settings & setup',
        roles: ['superadmin'] },
      { key: 'audit_logs', label: 'View audit logs',
        roles: ['superadmin', 'administrator'] },
      { key: 'manage_all_users', label: 'Manage all users',
        roles: ['superadmin', 'administrator'] },
      { key: 'export_reports', label: 'Export platform reports',
        roles: ['superadmin', 'administrator', 'state_government', 'central_government'] },
      { key: 'role_permissions', label: 'Edit roles & permissions',
        roles: ['superadmin'] },
    ],
  },
  {
    label: 'User Management',
    icon: '👥',
    color: '#1E5FBF',
    perms: [
      { key: 'view_candidates', label: 'View candidate profiles',
        roles: ['superadmin', 'administrator', 'state_government', 'central_government', 'employer', 'placement_agency', 'csr_org'] },
      { key: 'view_employers', label: 'View employer profiles',
        roles: ['superadmin', 'administrator', 'state_government', 'central_government'] },
      { key: 'view_training_vendors', label: 'View training vendor profiles',
        roles: ['superadmin', 'administrator', 'state_government', 'central_government'] },
      { key: 'view_trainers', label: 'View trainer profiles',
        roles: ['superadmin', 'administrator', 'state_government', 'central_government'] },
      { key: 'view_agencies', label: 'View placement / CSR profiles',
        roles: ['superadmin', 'administrator', 'state_government', 'central_government'] },
      { key: 'edit_own_profile', label: 'Edit own profile',
        roles: ['superadmin', 'administrator', 'state_government', 'central_government', 'employer', 'training_vendor', 'trainer', 'placement_agency', 'csr_org', 'candidate'] },
    ],
  },
  {
    label: 'Jobs',
    icon: '💼',
    color: '#0891B2',
    perms: [
      { key: 'post_jobs', label: 'Post job openings',
        roles: ['employer', 'placement_agency', 'csr_org', 'administrator'] },
      { key: 'view_all_jobs', label: 'View all job listings',
        roles: ['superadmin', 'administrator', 'state_government', 'central_government', 'employer', 'training_vendor', 'trainer', 'placement_agency', 'csr_org', 'candidate'] },
      { key: 'manage_own_jobs', label: 'Manage own job postings',
        roles: ['employer', 'placement_agency', 'csr_org', 'administrator'] },
      { key: 'close_any_job', label: 'Close / remove any job',
        roles: ['superadmin', 'administrator'] },
    ],
  },
  {
    label: 'Applications',
    icon: '📄',
    color: '#C0392B',
    perms: [
      { key: 'apply_jobs', label: 'Apply for jobs',
        roles: ['candidate'] },
      { key: 'view_own_applications', label: 'View own applications',
        roles: ['candidate'] },
      { key: 'view_job_applicants', label: 'View applicants for own jobs',
        roles: ['employer', 'placement_agency', 'csr_org', 'administrator'] },
      { key: 'manage_all_applications', label: 'Manage all applications',
        roles: ['superadmin', 'administrator'] },
      { key: 'update_app_status', label: 'Update application status',
        roles: ['employer', 'placement_agency', 'csr_org', 'administrator', 'superadmin'] },
    ],
  },
  {
    label: 'Courses & Training',
    icon: '🎓',
    color: '#0A7B6C',
    perms: [
      { key: 'view_courses', label: 'View course catalogue',
        roles: ['superadmin', 'administrator', 'state_government', 'central_government', 'employer', 'training_vendor', 'trainer', 'placement_agency', 'csr_org', 'candidate'] },
      { key: 'create_courses', label: 'Create / edit courses',
        roles: ['trainer', 'administrator', 'superadmin'] },
      { key: 'enroll_courses', label: 'Enroll in courses',
        roles: ['candidate'] },
      { key: 'manage_infrastructure', label: 'Manage training infrastructure',
        roles: ['training_vendor'] },
      { key: 'approve_vendors', label: 'Approve training vendors',
        roles: ['superadmin', 'administrator', 'state_government', 'central_government'] },
    ],
  },
  {
    label: 'Government & Compliance',
    icon: '🏛️',
    color: '#065F46',
    perms: [
      { key: 'view_state_data', label: 'View state-level analytics',
        roles: ['superadmin', 'administrator', 'state_government', 'central_government'] },
      { key: 'view_national_data', label: 'View national-level analytics',
        roles: ['superadmin', 'administrator', 'central_government'] },
      { key: 'manage_schemes', label: 'Manage government schemes',
        roles: ['superadmin', 'state_government', 'central_government'] },
      { key: 'compliance_reports', label: 'Compliance & audit reports',
        roles: ['superadmin', 'administrator', 'state_government', 'central_government'] },
    ],
  },
];

function buildMatrix() {
  const m = {};
  for (const g of GROUPS) {
    for (const p of g.perms) {
      m[p.key] = {};
      for (const r of ROLES) m[p.key][r.key] = p.roles.includes(r.key);
    }
  }
  return m;
}

export default function RolesPermissions() {
  const [matrix, setMatrix] = useState(buildMatrix);
  const [saved, setSaved] = useState(false);
  const [editMode, setEditMode] = useState(false);

  function toggle(permKey, roleKey) {
    if (!editMode) return;
    setMatrix(prev => ({
      ...prev,
      [permKey]: { ...prev[permKey], [roleKey]: !prev[permKey][roleKey] },
    }));
  }

  function save() {
    setSaved(true);
    setEditMode(false);
    setTimeout(() => setSaved(false), 2500);
  }

  function reset() {
    setMatrix(buildMatrix());
    setEditMode(false);
  }

  const CELL_W = 72;
  const ROW_H = 36;
  const LABEL_W = 260;

  return (
    <div className="page" style={{ maxWidth: 1300 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1>Roles &amp; Permissions</h1>
          <p>Define what each role can access across the platform. Click <strong>Edit</strong> to toggle permissions.</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0, marginTop: 4 }}>
          {saved && <span style={{ fontSize: 13, color: '#10B981', fontWeight: 600 }}>✓ Saved</span>}
          {editMode ? (
            <>
              <button className="btn btn-outline btn-sm" onClick={reset}>Reset</button>
              <button className="btn btn-primary btn-sm" onClick={save}>Save changes</button>
            </>
          ) : (
            <button className="btn btn-primary btn-sm" onClick={() => setEditMode(true)}>✏️ Edit</button>
          )}
        </div>
      </div>

      {/* Role legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
        {ROLES.map(r => (
          <div key={r.key} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', border: '1px solid #DDE3EE', borderRadius: 20, padding: '4px 10px 4px 6px' }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: r.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 800, color: '#fff', letterSpacing: 0 }}>{r.short[0]}</div>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#445074' }}>{r.label}</span>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 8 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#7886A6' }}>
            <span style={{ width: 14, height: 14, borderRadius: 4, background: '#10B981', display: 'inline-block' }} /> Allowed
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#7886A6' }}>
            <span style={{ width: 14, height: 14, borderRadius: 4, background: '#F1F5F9', border: '1px solid #DDE3EE', display: 'inline-block' }} /> Not allowed
          </span>
          {editMode && <span style={{ fontSize: 11, color: '#6B9EF0', fontWeight: 600 }}>● Edit mode on — click cells to toggle</span>}
        </div>
      </div>

      {/* Matrix table */}
      <div className="card shadow" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%', tableLayout: 'fixed', minWidth: LABEL_W + CELL_W * ROLES.length }}>

            {/* Col widths */}
            <colgroup>
              <col style={{ width: LABEL_W }} />
              {ROLES.map(r => <col key={r.key} style={{ width: CELL_W }} />)}
            </colgroup>

            {/* Header: role names */}
            <thead>
              <tr style={{ background: '#0F2545', position: 'sticky', top: 0, zIndex: 2 }}>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.5)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Permission
                </th>
                {ROLES.map(r => (
                  <th key={r.key} style={{ textAlign: 'center', padding: '6px 4px' }}>
                    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: r.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 800, color: '#fff' }}>{r.short}</div>
                      <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,.65)', textTransform: 'uppercase', letterSpacing: 0.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: CELL_W - 8 }}>{r.label}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {GROUPS.map((g, gi) => (
                <>
                  {/* Group header row */}
                  <tr key={`g-${gi}`} style={{ background: `${g.color}12` }}>
                    <td colSpan={ROLES.length + 1} style={{ padding: '7px 16px', fontSize: 11, fontWeight: 800, color: g.color, textTransform: 'uppercase', letterSpacing: 0.6, borderTop: gi > 0 ? '2px solid #EEF2F8' : 'none' }}>
                      {g.icon} {g.label}
                    </td>
                  </tr>

                  {/* Permission rows */}
                  {g.perms.map((p, pi) => (
                    <tr key={p.key} style={{ background: pi % 2 === 0 ? '#fff' : '#FAFBFD', borderBottom: '1px solid #EEF2F8' }}>
                      <td style={{ padding: '0 16px', height: ROW_H, fontSize: 13, color: '#0B1E3D', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {p.label}
                      </td>
                      {ROLES.map(r => {
                        const allowed = matrix[p.key][r.key];
                        return (
                          <td
                            key={r.key}
                            onClick={() => toggle(p.key, r.key)}
                            style={{
                              textAlign: 'center',
                              height: ROW_H,
                              cursor: editMode ? 'pointer' : 'default',
                              transition: 'background .1s',
                              background: editMode && allowed ? '#F0FDF4' : undefined,
                            }}
                            title={editMode ? `Toggle ${r.label} — ${p.label}` : `${r.label}: ${allowed ? 'Allowed' : 'Not allowed'}`}
                          >
                            {allowed ? (
                              <div style={{ display: 'inline-flex', width: 22, height: 22, borderRadius: 6, background: '#10B981', alignItems: 'center', justifyContent: 'center' }}>
                                <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M2 5.5L4.5 8L9 3" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                              </div>
                            ) : (
                              <div style={{ display: 'inline-flex', width: 22, height: 22, borderRadius: 6, background: editMode ? '#FEF2F2' : '#F1F5F9', border: `1px solid ${editMode ? '#FECACA' : '#DDE3EE'}`, alignItems: 'center', justifyContent: 'center' }}>
                                <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M2 2L7 7M7 2L2 7" stroke={editMode ? '#FCA5A5' : '#CBD5E1'} strokeWidth="1.5" strokeLinecap="round"/></svg>
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </>
              ))}
            </tbody>

            {/* Footer: totals per role */}
            <tfoot>
              <tr style={{ background: '#0F2545', borderTop: '2px solid #1A3560' }}>
                <td style={{ padding: '8px 16px', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.5)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Total permissions
                </td>
                {ROLES.map(r => {
                  const total = Object.values(matrix).filter(m => m[r.key]).length;
                  const max = Object.keys(matrix).length;
                  return (
                    <td key={r.key} style={{ textAlign: 'center', padding: '8px 4px' }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{total}</div>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,.4)' }}>of {max}</div>
                    </td>
                  );
                })}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
