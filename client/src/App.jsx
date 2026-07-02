import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
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
import Infrastructure from './pages/Infrastructure.jsx';
import SuperadminDashboard from './pages/SuperadminDashboard.jsx';
import SuperadminSetup from './pages/SuperadminSetup.jsx';
import RolesPermissions from './pages/RolesPermissions.jsx';
import AuditLogs from './pages/AuditLogs.jsx';
import ReportsExports from './pages/ReportsExports.jsx';
import FileImports from './pages/FileImports.jsx';
import SectorsCategories from './pages/SectorsCategories.jsx';
import GovernmentSchemes from './pages/GovernmentSchemes.jsx';
import EmailNotifications from './pages/EmailNotifications.jsx';
import ManageSkills from './pages/ManageSkills.jsx';
import PlatformAnalytics from './pages/PlatformAnalytics.jsx';
import TrainingVendors from './pages/TrainingVendors.jsx';
import Trainers from './pages/Trainers.jsx';
import ManageUsers from './pages/ManageUsers.jsx';
import OrgClassifications from './pages/OrgClassifications.jsx';
import Accreditations from './pages/Accreditations.jsx';
import GeographicCoverage from './pages/GeographicCoverage.jsx';
import TargetBeneficiaries from './pages/TargetBeneficiaries.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import { SkillsProvider } from './context/SkillsContext.jsx';

function Protected({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="spinner-wrap">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  const { user, loading } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  if (loading) return <div className="spinner-wrap">Loading SkillsNJobs…</div>;

  return (
    <SkillsProvider>
    <div className="app-shell">
      {user && <Navbar />}
      <div style={{ display: 'flex', flex: 1 }}>
        {user && <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(c => !c)} />}
        <div style={{ flex: 1, minWidth: 0 }}>
          <Routes>
            <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
            <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />
            <Route path="/forgot-password" element={user ? <Navigate to="/dashboard" /> : <ForgotPassword />} />
            <Route path="/reset-password" element={user ? <Navigate to="/dashboard" /> : <ResetPassword />} />

            <Route path="/dashboard" element={<Protected>{user?.role === 'superadmin' ? <Navigate to="/superadmin" replace /> : <Dashboard />}</Protected>} />
            <Route path="/jobs" element={<Protected><Jobs /></Protected>} />
            <Route path="/jobs/:id" element={<Protected><JobDetail /></Protected>} />
            <Route path="/my-jobs" element={<Protected roles={['employer', 'admin']}><MyJobs /></Protected>} />
            <Route path="/applications" element={<Protected roles={['candidate', 'administrator']}><Applications /></Protected>} />
            <Route path="/courses" element={<Protected><Courses /></Protected>} />
            <Route path="/candidates" element={<Protected roles={['employer', 'admin', 'superadmin', 'state_government', 'central_government']}><Candidates /></Protected>} />
            <Route path="/profile" element={<Protected><Profile /></Protected>} />
            <Route path="/infrastructure" element={<Protected roles={['training_vendor']}><Infrastructure /></Protected>} />
            <Route path="/superadmin" element={<Protected roles={['superadmin']}><SuperadminDashboard /></Protected>} />
            <Route path="/superadmin/setup" element={<Protected roles={['superadmin']}><SuperadminSetup /></Protected>} />
            <Route path="/superadmin/setup/target-beneficiaries" element={<Protected roles={['superadmin']}><TargetBeneficiaries /></Protected>} />
            <Route path="/superadmin/setup/geographic-coverage" element={<Protected roles={['superadmin']}><GeographicCoverage /></Protected>} />
            <Route path="/superadmin/setup/accreditations" element={<Protected roles={['superadmin']}><Accreditations /></Protected>} />
            <Route path="/superadmin/setup/org-classifications" element={<Protected roles={['superadmin']}><OrgClassifications /></Protected>} />
            <Route path="/superadmin/setup/manage-users" element={<Protected roles={['superadmin']}><ManageUsers /></Protected>} />
            <Route path="/superadmin/setup/roles-permissions" element={<Protected roles={['superadmin']}><RolesPermissions /></Protected>} />
            <Route path="/superadmin/setup/audit-logs" element={<Protected roles={['superadmin','administrator','admin']}><AuditLogs /></Protected>} />
            <Route path="/superadmin/setup/reports" element={<Protected roles={['superadmin','administrator','admin','state_government','central_government']}><ReportsExports /></Protected>} />
            <Route path="/superadmin/setup/file-imports" element={<Protected roles={['superadmin']}><FileImports /></Protected>} />
            <Route path="/superadmin/setup/sectors" element={<Protected roles={['superadmin']}><SectorsCategories /></Protected>} />
            <Route path="/superadmin/setup/schemes" element={<Protected roles={['superadmin']}><GovernmentSchemes /></Protected>} />
            <Route path="/superadmin/setup/email" element={<Protected roles={['superadmin']}><EmailNotifications /></Protected>} />
            <Route path="/superadmin/setup/skills" element={<Protected roles={['superadmin']}><ManageSkills /></Protected>} />
            <Route path="/superadmin/analytics" element={<Protected roles={['superadmin']}><PlatformAnalytics /></Protected>} />
            <Route path="/superadmin/training-vendors" element={<Protected roles={['superadmin']}><TrainingVendors /></Protected>} />
            <Route path="/superadmin/trainers" element={<Protected roles={['superadmin']}><Trainers /></Protected>} />
            <Route path="/superadmin/:section" element={<Protected roles={['superadmin']}><SuperadminDashboard /></Protected>} />

            <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
          </Routes>
        </div>
      </div>
    </div>
    </SkillsProvider>
  );
}
