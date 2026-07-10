import { useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Navbar from './components/Navbar.jsx';
import Sidebar from './components/Sidebar.jsx';
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
import SuperadminDashboard from './pages/SuperadminDashboard.jsx';
import TrainingVendorPortal from './pages/TrainingVendorPortal.jsx';
import CandidatePortal from './pages/CandidatePortal.jsx';
import TrainerPortal from './pages/TrainerPortal.jsx';
import PlacementPartnerPortal from './pages/PlacementPartnerPortal.jsx';
import CsrOrganizationPortal from './pages/CsrOrganizationPortal.jsx';
import EmployerPortal from './pages/EmployerPortal.jsx';
import StateGovtPortal from './pages/StateGovtPortal.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import LandingPage from './pages/LandingPage.jsx';
import ContactUs from './pages/ContactUs.jsx';
import { SkillsProvider } from './context/SkillsContext.jsx';
import { LanguageProvider } from './context/LanguageContext.jsx';

function Protected({ children, roles, vendorOk }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="spinner-wrap">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  if (user.role === 'training_vendor' && !vendorOk) return <Navigate to="/vendor-portal" replace />;
  if (user.role === 'trainer' && !roles?.includes('trainer')) return <Navigate to="/trainer-portal" replace />;
  if (user.role === 'placement_agency' && !roles?.includes('placement_agency')) return <Navigate to="/placement-partner-portal" replace />;
  if (user.role === 'csr_org' && !roles?.includes('csr_org')) return <Navigate to="/csr-portal" replace />;
  if (user.role === 'employer' && !roles?.includes('employer')) return <Navigate to="/employer-portal" replace />;
  if (user.role === 'superadmin' && roles && !roles.includes('superadmin')) return <Navigate to="/superadmin" replace />;
  if (user.role === 'state_government' && !roles?.includes('state_government')) return <Navigate to="/state-govt-portal" replace />;
  return children;
}

export default function App() {
  const { user, loading } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  if (loading) return <div className="spinner-wrap">Loading SkillsNJobs…</div>;

  const isVendor = user?.role === 'training_vendor';
  const isCandidate = user?.role === 'candidate';
  const isTrainer = user?.role === 'trainer';
  const isPlacementAgency = user?.role === 'placement_agency';
  const isCsrOrg = user?.role === 'csr_org';
  const isEmployer = user?.role === 'employer';
  const isSuperadmin = user?.role === 'superadmin';
  const isStateGovt = user?.role === 'state_government';
  const isPortalUser = isVendor || isCandidate || isTrainer || isPlacementAgency || isCsrOrg || isEmployer || isSuperadmin || isStateGovt;

  return (
    <LanguageProvider>
    <SkillsProvider>
    <div className="app-shell">
      <div style={{ display: 'flex', flex: 1, alignItems: 'flex-start' }}>
        {user && !isPortalUser && <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(c => !c)} />}
        <div style={{ flex: 1, minWidth: 0, display:'flex', flexDirection:'column' }}>
          {user && !isPortalUser && <Navbar />}
          <Routes>
            <Route path="/" element={user ? <Navigate to="/dashboard" /> : <LandingPage />} />
            <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
            <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />
            <Route path="/forgot-password" element={user ? <Navigate to="/dashboard" /> : <ForgotPassword />} />
            <Route path="/contact" element={<ContactUs />} />
            <Route path="/reset-password" element={user ? <Navigate to="/dashboard" /> : <ResetPassword />} />

            <Route path="/vendor-portal" element={<Protected roles={['training_vendor']} vendorOk><TrainingVendorPortal /></Protected>} />
            <Route path="/candidate-portal" element={<Protected roles={['candidate']}><CandidatePortal /></Protected>} />
            <Route path="/trainer-portal" element={<Protected roles={['trainer']}><TrainerPortal /></Protected>} />
            <Route path="/placement-partner-portal" element={<Protected roles={['placement_agency']}><PlacementPartnerPortal /></Protected>} />
            <Route path="/csr-portal" element={<Protected roles={['csr_org']}><CsrOrganizationPortal /></Protected>} />
            <Route path="/employer-portal" element={<Protected roles={['employer']}><EmployerPortal /></Protected>} />

            <Route path="/superadmin" element={<Protected roles={['superadmin']}><SuperadminDashboard /></Protected>} />
            <Route path="/state-govt-portal" element={<Protected roles={['state_government', 'superadmin']}><StateGovtPortal /></Protected>} />

            <Route path="/dashboard" element={<Protected>{
              user?.role === 'superadmin' ? <Navigate to="/superadmin" replace /> :
              user?.role === 'state_government' ? <Navigate to="/state-govt-portal" replace /> :
              user?.role === 'training_vendor' ? <Navigate to="/vendor-portal" replace /> :
              user?.role === 'candidate' ? <Navigate to="/candidate-portal" replace /> :
              user?.role === 'trainer' ? <Navigate to="/trainer-portal" replace /> :
              user?.role === 'placement_agency' ? <Navigate to="/placement-partner-portal" replace /> :
              user?.role === 'csr_org' ? <Navigate to="/csr-portal" replace /> :
              user?.role === 'employer' ? <Navigate to="/employer-portal" replace /> :
              <Dashboard />
            }</Protected>} />

            <Route path="/jobs" element={<Protected><Jobs /></Protected>} />
            <Route path="/jobs/:id" element={<Protected><JobDetail /></Protected>} />
            <Route path="/my-jobs" element={<Protected roles={['employer', 'admin']}><MyJobs /></Protected>} />
            <Route path="/applications" element={<Protected roles={['candidate', 'administrator']}><Applications /></Protected>} />
            <Route path="/courses" element={<Protected><Courses /></Protected>} />
            <Route path="/candidates" element={<Protected roles={['employer', 'admin', 'state_government', 'central_government']}><Candidates /></Protected>} />
            <Route path="/profile" element={<Protected><Profile /></Protected>} />

            <Route path="*" element={<Navigate to={
              user ? (
                user.role === 'training_vendor' ? '/vendor-portal' :
                user.role === 'candidate' ? '/candidate-portal' :
                user.role === 'trainer' ? '/trainer-portal' :
                user.role === 'placement_agency' ? '/placement-partner-portal' :
                user.role === 'csr_org' ? '/csr-portal' :
                user.role === 'employer' ? '/employer-portal' :
                user.role === 'state_government' ? '/state-govt-portal' :
                '/dashboard'
              ) : '/'
            } replace />} />
          </Routes>
        </div>
      </div>
    </div>
    </SkillsProvider>
    </LanguageProvider>
  );
}
