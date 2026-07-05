import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

const ALL_LINKS = [
  { to: '/dashboard', icon: '🏠', label: 'Dashboard', roles: ['candidate','employer','trainer','admin','placement_agency','csr_org','administrator','state_government','central_government'] },
  { to: '/jobs', icon: '💼', label: 'Jobs', roles: ['candidate','employer','trainer','admin','placement_agency','csr_org','administrator','state_government','central_government'] },
  { to: '/my-jobs', icon: '📋', label: 'My Postings', roles: ['employer','admin','placement_agency','csr_org','administrator','state_government','central_government'] },
  { to: '/candidates', icon: '👥', label: 'Candidates', roles: ['employer','admin','placement_agency','csr_org','administrator','state_government','central_government'] },
  { to: '/applications', icon: '📄', label: 'My Applications', roles: ['candidate','administrator'] },
  { to: '/courses', icon: '🎓', label: 'Courses', roles: ['candidate','employer','trainer','admin','placement_agency','csr_org','administrator','state_government','central_government'] },
  // Training Vendor — single entry point to the full portal
  { to: '/vendor-portal', icon: '🎓', label: 'Training Portal', roles: ['training_vendor'] },
];

export default function Sidebar({ collapsed, onToggle }) {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [openMenus, setOpenMenus] = useState({});
  const initials = (user?.name || 'U').split(' ').map(p => p[0]).slice(0,2).join('').toUpperCase();

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
      width: collapsed ? 56 : 210,
      minHeight: '100vh',
      background: '#1A56C4',
      borderRight: '1px solid rgba(255,255,255,0.08)',
      display: 'flex',
      flexDirection: 'column',
      transition: 'width .2s ease',
      overflow: 'hidden',
      flexShrink: 0,
      position: 'sticky',
      top: 0,
      height: '100vh',
      alignSelf: 'flex-start',
      zIndex: 40,
    }}>

      {/* Logo header */}
      <div style={{ display:'flex', alignItems:'center', gap:10, padding: collapsed ? '12px 0' : '12px 14px',
        justifyContent: collapsed ? 'center' : 'flex-start',
        borderBottom:'1px solid rgba(255,255,255,0.12)', flexShrink:0, cursor:'pointer' }}
        onClick={() => navigate(user?.role === 'superadmin' ? '/superadmin' : '/dashboard')}>
        <div style={{ width:32, height:32, borderRadius:8, background:'rgba(255,255,255,.18)', display:'flex',
          alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>🎯</div>
        {!collapsed && (
          <div>
            <div style={{ color:'#fff', fontWeight:800, fontSize:14, lineHeight:1.1 }}>SkillsNJobs</div>
            <div style={{ color:'rgba(255,255,255,.45)', fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'.1em' }}>Skill to Career</div>
          </div>
        )}
        {!collapsed && (
          <button onClick={e => { e.stopPropagation(); onToggle(); }}
            style={{ marginLeft:'auto', background:'none', border:'none', color:'rgba(255,255,255,.5)',
              cursor:'pointer', fontSize:13, padding:'2px 4px', lineHeight:1 }}>◀</button>
        )}
        {collapsed && (
          <button onClick={e => { e.stopPropagation(); onToggle(); }}
            style={{ position:'absolute', background:'none', border:'none', color:'rgba(255,255,255,.5)',
              cursor:'pointer', fontSize:11, padding:0, lineHeight:1, display:'none' }} />
        )}
      </div>

      {/* Collapsed expand button */}
      {collapsed && (
        <button onClick={onToggle}
          style={{ background:'none', border:'none', borderBottom:'1px solid rgba(255,255,255,.1)',
            color:'rgba(255,255,255,.6)', cursor:'pointer', fontSize:12, padding:'8px 0', width:'100%' }}>▶</button>
      )}

      {/* Nav links */}
      <nav style={{ flex: 1, padding: '8px 0', overflowY:'auto' }}>
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
                    padding: collapsed ? '11px 0' : '7px 12px',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    fontSize: 13, fontWeight: parentActive ? 700 : 500, cursor: 'pointer',
                    color: '#fff',
                    background: parentActive ? 'rgba(255,255,255,0.22)' : 'transparent',
                    borderRadius: 6, margin: collapsed ? '1px 0' : '1px 6px',
                    border: '1px solid transparent',
                    transition: 'background .15s',
                    whiteSpace: 'nowrap', overflow: 'hidden', userSelect: 'none',
                  }}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{l.icon}</span>
                  {!collapsed && (
                    <>
                      <span style={{ flex: 1 }}>{l.label}</span>
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginRight: 2, transition: 'transform .2s', transform: isOpen ? 'rotate(180deg)' : 'none' }}>▾</span>
                    </>
                  )}
                </div>
                {/* Children */}
                {!collapsed && isOpen && (
                  <div>
                    {l.children.filter(c => !c.roles || c.roles.includes(user.role)).map(child => (
                      <NavLink key={child.to} to={child.to} end
                        style={({ isActive }) => ({
                          display: 'flex', alignItems: 'center', gap: 8,
                          padding: '5px 12px 5px 30px',
                          fontSize: 12, fontWeight: isActive ? 700 : 500,
                          color: isActive ? '#fff' : 'rgba(255,255,255,0.75)',
                          background: isActive ? 'rgba(255,255,255,0.18)' : 'transparent',
                          borderRadius: 6, margin: '1px 6px',
                          textDecoration: 'none', transition: 'background .15s',
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
                padding: collapsed ? '11px 0' : '7px 12px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                fontSize: 13, fontWeight: isActive ? 700 : 500,
                color: '#fff',
                background: isActive ? 'rgba(255,255,255,0.22)' : 'transparent',
                borderRadius: 6, margin: collapsed ? '1px 0' : '1px 6px',
                border: '1px solid transparent',
                textDecoration: 'none', transition: 'background .15s',
                whiteSpace: 'nowrap', overflow: 'hidden',
              })}
            >
              <span style={{ fontSize: 16, flexShrink: 0 }}>{l.icon}</span>
              {!collapsed && <span>{l.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* User footer */}
      <div style={{ padding: collapsed ? '10px 0' : '10px 12px', borderTop:'1px solid rgba(255,255,255,.12)',
        display:'flex', alignItems:'center', gap:8, justifyContent: collapsed ? 'center' : 'flex-start', flexShrink:0 }}>
        <div style={{ width:30, height:30, borderRadius:'50%', background:'rgba(255,255,255,.2)',
          display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:11, fontWeight:700, flexShrink:0 }}>
          {initials}
        </div>
        {!collapsed && (
          <div style={{ minWidth:0 }}>
            <div style={{ color:'rgba(255,255,255,.9)', fontSize:11, fontWeight:700, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {user?.first_name || user?.name?.split(' ')[0] || 'User'}
            </div>
            <div style={{ color:'rgba(255,255,255,.45)', fontSize:10, textTransform:'capitalize' }}>
              {user?.role?.replace(/_/g,' ')}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
