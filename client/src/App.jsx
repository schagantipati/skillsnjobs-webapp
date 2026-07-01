import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Navbar from './components/Navbar.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Jobs from './pages/Jobs.jsx';
import JobDetail from './pages/JobDetail.jsx';
import MyJobs from './pages/MyJobs.jsx';
import Applications from './pages/Applications.jsx';
import Courses from './pages/Courses.jsx';
import Candidates from './pages/Candidates.jsx';
import Profile from './pages/Profile.jsx';

function Protected({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="spinner-wrap">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) return <div className="spinner-wrap">Loading SkillsNJobs…</div>;

  return (
    <div className="app-shell">
      {user && <Navbar />}
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />

        <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
        <Route path="/jobs" element={<Protected><Jobs /></Protected>} />
        <Route path="/jobs/:id" element={<Protected><JobDetail /></Protected>} />
        <Route path="/my-jobs" element={<Protected roles={['employer', 'admin']}><MyJobs /></Protected>} />
        <Route path="/applications" element={<Protected roles={['candidate', 'administrator']}><Applications /></Protected>} />
        <Route path="/courses" element={<Protected><Courses /></Protected>} />
        <Route path="/candidates" element={<Protected roles={['employer', 'admin']}><Candidates /></Protected>} />
        <Route path="/profile" element={<Protected><Profile /></Protected>} />

        <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
      </Routes>
    </div>
  );
}
