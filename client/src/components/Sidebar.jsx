import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const ALL_LINKS = [
  { to: '/dashboard', icon: '🏠', label: 'Dashboard', roles: ['candidate','employer','trainer','admin','placement_agency','csr_org','administrator','state_government','central_government','training_vendor'] },
  { to: '/jobs', icon: '💼', label: 'Jobs', roles: ['candidate','employer','trainer','admin','placement_agency','csr_org','administrator','state_government','central_government','training_vendor'] },
  { to: '/my-jobs', icon: '📋', label: 'My Postings', roles: ['employer','admin','placement_agency','csr_org','administrator','state_government','central_government'] },
  { to: '/candidates', icon: '👥', label: 'Candidates', roles: ['employer','admin','placement_agency','csr_org','administrator','state_government','central_government'] },
  { to: '/applications', icon: '📄', label: 'My Applications', roles: ['candidate','administrator'] },
  { to: '/courses', icon: '🎓', label: 'Courses', roles: ['candidate','employer','trainer','admin','placement_agency','csr_org','administrator','state_government','central_government','training_vendor'] },
  { to: '/infrastructure', icon: '🏗️', label: 'Infrastructure', roles: ['training_vendor'] },
  // Superadmin links
  { to: '/superadmin', icon: '🛡️', label: 'Dashboard', roles: ['superadmin'] },
  { to: '/candidates', icon: '👥', label: 'Candidates', roles: ['superadmin'] },
  { to: '/superadmin/training-vendors', icon: '🏫', label: 'Training Vendors', roles: ['superadmin'] },
  { to: '/superadmin/trainers', icon: '👨‍🏫', label: 'Trainers', roles: ['superadmin'] },
  { to: '/superadmin/csr-organizations', icon: '🤝', label: 'CSR Organizations', roles: ['superadmin'] },
  { to: '/superadmin/placement-agencies', icon: '💼', label: 'Placement Agencies', roles: ['superadmin'] },
  { to: '/superadmin/employers', icon: '🏢', label: 'Employers', roles: ['superadmin'] },
  { to: '/superadmin/setup', icon: '⚙️', label: 'Setup', roles: ['superadmin'] },
];

export default function Sidebar({ collapsed, onToggle }) {
  const { user } = useAuth();

  const links = ALL_LINKS.filter(l => !l.roles || l.roles.includes(user.role));

  return (
    <aside style={{
      width: collapsed ? 56 : 200,
      minHeight: 'calc(100vh - 62px)',
      background: '#0F2545',
      borderRight: '1px solid rgba(255,255,255,0.06)',
      display: 'flex',
      flexDirection: 'column',
      transition: 'width .2s ease',
      overflow: 'hidden',
      flexShrink: 0,
      position: 'sticky',
      top: 62,
      alignSelf: 'flex-start',
      zIndex: 40,
    }}>

      {/* Toggle button */}
      <button
        onClick={onToggle}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-end',
          padding: '10px 12px',
          background: 'none',
          border: 'none',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          color: 'rgba(255,255,255,0.45)',
          cursor: 'pointer',
          fontSize: 14,
          width: '100%',
        }}
        title={collapsed ? 'Expand menu' : 'Collapse menu'}
      >
        {collapsed ? '▶' : '◀'}
      </button>

      {/* Nav links */}
      <nav style={{ flex: 1, padding: '8px 0' }}>
        {links.map(l => (
          <NavLink
            key={l.to}
            to={l.to}
            title={collapsed ? l.label : undefined}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: collapsed ? '11px 0' : '11px 16px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              fontSize: 13,
              fontWeight: 600,
              color: isActive ? '#fff' : 'rgba(255,255,255,0.6)',
              background: isActive ? 'rgba(255,255,255,0.10)' : 'transparent',
              borderLeft: isActive ? '3px solid #6B9EF0' : '3px solid transparent',
              textDecoration: 'none',
              transition: 'background .15s, color .15s',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
            })}
          >
            <span style={{ fontSize: 16, flexShrink: 0 }}>{l.icon}</span>
            {!collapsed && <span>{l.label}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
