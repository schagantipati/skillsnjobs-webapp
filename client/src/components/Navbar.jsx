import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const isEmployerLike = ['employer', 'admin', 'placement_agency', 'csr_org', 'administrator', 'state_government', 'central_government'].includes(user.role);

  const links = user.role === 'superadmin' ? [
    { to: '/superadmin', label: 'Dashboard' },
    { to: '/candidates', label: 'Candidates' },
    { to: '/superadmin/training-vendors', label: 'Training Vendors' },
    { to: '/superadmin/trainers', label: 'Trainers' },
    { to: '/superadmin/csr-organizations', label: 'CSR Organizations' },
    { to: '/superadmin/placement-agencies', label: 'Placement Agencies' },
    { to: '/superadmin/employers', label: 'Employers' },
    { to: '/superadmin/setup', label: 'Setup' },
  ] : [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/jobs', label: 'Jobs' },
    isEmployerLike ? { to: '/my-jobs', label: 'My Postings' } : null,
    isEmployerLike ? { to: '/candidates', label: 'Candidates' } : null,
    (user.role === 'candidate' || user.role === 'administrator') ? { to: '/applications', label: user.role === 'administrator' ? 'All Applications' : 'My Applications' } : null,
    { to: '/courses', label: 'Courses' },
    user.role === 'training_vendor' ? { to: '/infrastructure', label: 'Infrastructure' } : null,
  ].filter(Boolean);

  const initials = user.name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="navbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: user.role === 'superadmin' ? 12 : 30 }}>
        <div className="nav-brand" onClick={() => navigate(user.role === 'superadmin' ? '/superadmin' : '/dashboard')} style={{ cursor: 'pointer' }}>
          <div className="mark">🎯</div>
          <div>
            SkillsNJobs
            <span className="tag">Skill to Career</span>
          </div>
        </div>
        <div className="nav-links" style={user.role === 'superadmin' ? { gap: 2 } : {}}>
          {links.map(l => (
            <NavLink key={l.to} to={l.to}
              className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
              style={user.role === 'superadmin' ? { padding: '6px 9px', fontSize: 12 } : {}}>
              {l.label}
            </NavLink>
          ))}
        </div>
      </div>
      <div className="nav-right">
        <div className="nav-user" onClick={() => navigate('/profile')} style={{ cursor: 'pointer' }}>
          {user.photo
            ? <img src={user.photo} alt="Profile" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.4)' }} />
            : <div className="nav-avatar">{initials}</div>
          }
          <div>
            <div style={{ fontWeight: 700 }}>{(user.first_name || user.name.split(' ')[0])}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,.5)', textTransform: 'capitalize' }}>{user.role}</div>
          </div>
        </div>
        <button className="nav-btn" onClick={logout}>Sign out</button>
      </div>
    </div>
  );
}
