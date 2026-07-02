import { NavLink, useLocation } from 'react-router-dom';
import { useState } from 'react';
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
  {
    icon: '🏫', label: 'Training Vendors', roles: ['superadmin', 'administrator'],
    to: '/superadmin/training-vendors',
    children: [
      { to: '/superadmin/training-vendors', icon: '📋', label: 'Vendor List', roles: ['superadmin', 'administrator'] },
      { to: '/superadmin/training-vendors/profiles', icon: '👤', label: 'Vendor Profiles', roles: ['superadmin', 'administrator'] },
    ],
  },
  { to: '/superadmin/trainers', icon: '👨‍🏫', label: 'Trainers', roles: ['superadmin'] },
  { to: '/superadmin/csr-organizations', icon: '🤝', label: 'CSR Organizations', roles: ['superadmin'] },
  { to: '/superadmin/placement-agencies', icon: '💼', label: 'Placement Agencies', roles: ['superadmin'] },
  { to: '/superadmin/employers', icon: '🏢', label: 'Employers', roles: ['superadmin'] },
  { to: '/superadmin/setup', icon: '⚙️', label: 'Setup', roles: ['superadmin'] },
];

export default function Sidebar({ collapsed, onToggle }) {
  const { user } = useAuth();
  const location = useLocation();
  const [openMenus, setOpenMenus] = useState({});

  const links = ALL_LINKS.filter(l => !l.roles || l.roles.includes(user.role));

  function toggleMenu(label) {
    setOpenMenus(prev => ({ ...prev, [label]: !prev[label] }));
  }

  function isParentActive(item) {
    if (!item.children) return false;
    return item.children.some(c => location.pathname === c.to || location.pathname.startsWith(c.to + '/'));
  }

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
        {links.map(l => {
          if (l.children) {
            const parentActive = isParentActive(l);
            const isOpen = openMenus[l.label] !== undefined ? openMenus[l.label] : parentActive;
            return (
              <div key={l.label}>
                {/* Parent item */}
                <div
                  onClick={() => collapsed ? null : toggleMenu(l.label)}
                  title={collapsed ? l.label : undefined}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: collapsed ? '11px 0' : '11px 16px',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    color: parentActive ? '#fff' : 'rgba(255,255,255,0.6)',
                    background: parentActive ? 'rgba(255,255,255,0.10)' : 'transparent',
                    borderLeft: parentActive ? '3px solid #6B9EF0' : '3px solid transparent',
                    transition: 'background .15s, color .15s',
                    whiteSpace: 'nowrap', overflow: 'hidden', userSelect: 'none',
                  }}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{l.icon}</span>
                  {!collapsed && (
                    <>
                      <span style={{ flex: 1 }}>{l.label}</span>
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginRight: 2, transition: 'transform .2s', transform: isOpen ? 'rotate(90deg)' : 'none' }}>▶</span>
                    </>
                  )}
                </div>
                {/* Children */}
                {!collapsed && isOpen && (
                  <div style={{ background: 'rgba(0,0,0,0.15)' }}>
                    {l.children.filter(c => !c.roles || c.roles.includes(user.role)).map(child => (
                      <NavLink key={child.to} to={child.to} end
                        style={({ isActive }) => ({
                          display: 'flex', alignItems: 'center', gap: 8,
                          padding: '9px 16px 9px 36px',
                          fontSize: 12, fontWeight: 600,
                          color: isActive ? '#fff' : 'rgba(255,255,255,0.55)',
                          background: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
                          borderLeft: isActive ? '3px solid #6B9EF0' : '3px solid transparent',
                          textDecoration: 'none', transition: 'background .15s, color .15s',
                          whiteSpace: 'nowrap', overflow: 'hidden',
                        })}>
                        <span style={{ fontSize: 13 }}>{child.icon}</span>
                        <span>{child.label}</span>
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          return (
            <NavLink
              key={l.to}
              to={l.to}
              title={collapsed ? l.label : undefined}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10,
                padding: collapsed ? '11px 0' : '11px 16px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                fontSize: 13, fontWeight: 600,
                color: isActive ? '#fff' : 'rgba(255,255,255,0.6)',
                background: isActive ? 'rgba(255,255,255,0.10)' : 'transparent',
                borderLeft: isActive ? '3px solid #6B9EF0' : '3px solid transparent',
                textDecoration: 'none', transition: 'background .15s, color .15s',
                whiteSpace: 'nowrap', overflow: 'hidden',
              })}
            >
              <span style={{ fontSize: 16, flexShrink: 0 }}>{l.icon}</span>
              {!collapsed && <span>{l.label}</span>}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
