import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const PAGE_TITLES = {
  '/superadmin': { title: 'Dashboard', section: 'Platform Overview' },
  '/candidates': { title: 'Candidates', section: 'User Registry' },
  '/dashboard': { title: 'Dashboard', section: 'Overview' },
  '/profile': { title: 'My Profile', section: 'Account' },
  '/jobs': { title: 'Jobs', section: 'Browse' },
  '/courses': { title: 'Courses', section: 'Browse' },
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const initials = user.name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
  const dest = user.role === 'superadmin' ? '/superadmin' : '/dashboard';
  const page = PAGE_TITLES[location.pathname] || { title: '', section: '' };

  return (
    <div style={{
      height: 56, background: '#fff', borderBottom: '1px solid #E0E6EF',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 20px', position: 'sticky', top: 0, zIndex: 50,
      boxShadow: '0 1px 4px rgba(10,45,110,.06)',
    }}>
      {/* Page title */}
      <div style={{ display:'flex', alignItems:'center', gap:0 }}>
        {page.section && <span style={{ fontSize:11, color:'#6B7FA3', fontWeight:500, marginRight:6 }}>{page.section} /</span>}
        <span style={{ fontWeight:800, fontSize:15, color:'#003366' }}>{page.title || 'SkillsNJobs'}</span>
      </div>

      {/* Right — user + sign out */}
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <div onClick={() => navigate('/profile')} style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer' }}>
          {user.photo
            ? <img src={user.photo} alt="Profile" style={{ width:32, height:32, borderRadius:'50%', objectFit:'cover', border:'2px solid #E2E8F0' }} />
            : <div style={{ width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg,#003366,#1A56C4)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:12, color:'#fff', border:'2px solid #E2E8F0' }}>{initials}</div>
          }
          <div>
            <div style={{ fontWeight:700, fontSize:13, color:'#334155' }}>{user.first_name || user.name.split(' ')[0]}</div>
            <div style={{ fontSize:10, color:'#94A3B8', textTransform:'capitalize' }}>{user.role.replace(/_/g,' ')}</div>
          </div>
        </div>
        <button onClick={logout} style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 14px', borderRadius:7, border:'1px solid #E2E8F0', background:'#fff', color:'#64748B', fontSize:12, fontWeight:600, cursor:'pointer' }}>
          ⏻ Sign Out
        </button>
      </div>
    </div>
  );
}
