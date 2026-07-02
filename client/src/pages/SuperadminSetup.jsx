import { useNavigate } from 'react-router-dom';

export default function SuperadminSetup() {
  const navigate = useNavigate();

  const items = [
    { icon: '🏅', title: 'Accreditations & Empanelment', desc: 'Manage accreditation types for government verification — NSDC, PMKVY, ISO, NABL and more.', to: '/superadmin/setup/accreditations' },
    { icon: '🏢', title: 'Organisation Classifications', desc: 'Manage predefined organisation types used across the platform. Enable, disable, or add new values.', to: '/superadmin/setup/org-classifications' },
    { icon: '👤', title: 'Manage Users', desc: 'View, activate, deactivate or delete platform users by role.', to: '/superadmin/setup/manage-users' },
    { icon: '🔑', title: 'Roles & Permissions', desc: 'Manage what each role can access across the platform.', to: '/superadmin/setup/roles-permissions' },
    { icon: '📧', title: 'Email & Notifications', desc: 'Configure SMTP, OTP delivery, and notification templates.', to: '/superadmin/setup/email' },
    { icon: '🌐', title: 'Sectors & Categories', desc: 'Add or edit job sectors, skill categories, and course tags.', to: '/superadmin/setup/sectors' },
    { icon: '🛠️', title: 'Manage Skills', desc: 'NSDL / Central Govt. skill registry — skills and sub-skills used as dropdowns across the platform.', to: '/superadmin/setup/skills' },
    { icon: '🏛️', title: 'Government Schemes', desc: 'Manage PM schemes and apprenticeship listings.', to: '/superadmin/setup/schemes' },
    { icon: '📊', title: 'Reports & Exports', desc: 'Download platform-wide reports by role, region, or date.', to: '/superadmin/setup/reports' },
    { icon: '📥', title: 'File Imports', desc: 'Bulk import candidates, employers, jobs, courses and more via CSV.', to: '/superadmin/setup/file-imports' },
    { icon: '🛡️', title: 'Audit Logs', desc: 'View login history, profile changes, and admin actions.', to: '/superadmin/setup/audit-logs' },
  ];

  return (
    <div className="page" style={{ maxWidth: 900 }}>
      <div className="page-header">
        <h1>Setup</h1>
        <p>Platform configuration and system settings.</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {items.map(item => (
          <div key={item.title} className="card shadow"
            onClick={() => item.to && navigate(item.to)}
            style={{ display: 'flex', gap: 14, alignItems: 'flex-start', cursor: item.to ? 'pointer' : 'default', transition: 'box-shadow .15s', position: 'relative' }}
            onMouseEnter={e => { if (item.to) e.currentTarget.style.boxShadow = '0 8px 32px rgba(11,30,61,.16)'; }}
            onMouseLeave={e => e.currentTarget.style.boxShadow = ''}>
            <div style={{ fontSize: 28, flexShrink: 0 }}>{item.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#0B1E3D', marginBottom: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                {item.title}
                {item.to && <span style={{ fontSize: 14, color: '#6B9EF0' }}>›</span>}
              </div>
              <div style={{ fontSize: 13, color: '#7886A6' }}>{item.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
