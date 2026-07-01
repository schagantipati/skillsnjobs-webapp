import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const isEmployerLike = ['employer', 'admin', 'placement_agency', 'csr_org', 'administrator', 'state_government', 'central_government'].includes(user.role);

  const links = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/jobs', label: 'Jobs' },
    isEmployerLike ? { to: '/my-jobs', label: 'My Postings' } : null,
    isEmployerLike ? { to: '/candidates', label: 'Candidates' } : null,
    (user.role === 'candidate' || user.role === 'administrator') ? { to: '/applications', label: user.role === 'administrator' ? 'All Applications' : 'My Applications' } : null,
    { to: '/courses', label: 'Courses' },
  ].filter(Boolean);

  const initials = user.name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="navbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 30 }}>
        <div className="nav-brand" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
          <div className="mark">🎯</div>
          <div>
            SkillsNJobs
            <span className="tag">Skill to Career</span>
          </div>
        </div>
        <div className="nav-links">
          {links.map(l => (
            <NavLink key={l.to} to={l.to} className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
              {l.label}
            </NavLink>
          ))}
        </div>
      </div>
      <div className="nav-right">
        <div className="nav-user" onClick={() => navigate('/profile')} style={{ cursor: 'pointer' }}>
          <div className="nav-avatar">{initials}</div>
          <div>
            <div style={{ fontWeight: 700 }}>{user.name}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,.5)', textTransform: 'capitalize' }}>{user.role}</div>
          </div>
        </div>
        <button className="nav-btn" onClick={logout}>Sign out</button>
      </div>
    </div>
  );
}
