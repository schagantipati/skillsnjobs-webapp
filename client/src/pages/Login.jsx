import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginRole, setLoginRole] = useState(searchParams.get('role') || '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const hideRegister = loginRole === 'state_gov' || loginRole === 'superadmin';

  const LOGIN_ROLES = [
    { value: '', label: 'Select role (optional)' },
    { value: 'candidate', label: 'Candidate' },
    { value: 'employer', label: 'Employer' },
    { value: 'trainer', label: 'Trainer' },
    { value: 'placement_agency', label: 'Placement Agency' },
    { value: 'csr_org', label: 'CSR Organization' },
    { value: 'training_vendor', label: 'Training Vendor' },
    { value: 'state_gov', label: 'State Government' },
    { value: 'superadmin', label: 'Administrator' },
  ];

  async function submit(e) {
    e.preventDefault();
    setError(''); setBusy(true);
    try {
      const u = await login(email, password);
      if (u.role === 'training_vendor') {
        navigate('/vendor-portal');
      } else if (u.role === 'candidate') {
        navigate('/candidate-portal');
      } else if (u.role === 'trainer') {
        navigate('/trainer-portal');
      } else if (u.role === 'placement_agency') {
        navigate('/placement-partner-portal');
      } else if (u.role === 'csr_org') {
        navigate('/csr-portal');
      } else if (u.role === 'employer') {
        navigate('/employer-portal');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card" style={{ position: 'relative' }}>
        <button onClick={() => navigate('/')} style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#94a3b8', lineHeight: 1 }} title="Close">×</button>
        <div className="auth-logo"><img src="/logo.png" alt="Skills n Jobs" style={{ height: 48, width: 48, objectFit: 'contain' }} /><span>SkillsNJobs</span></div>
        <h2>Welcome back</h2>
        <p className="sub">Sign in to continue your skill-to-career journey.</p>
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={submit}>
          <div className="field">
            <label>I am a</label>
            <select value={loginRole} onChange={e => setLoginRole(e.target.value)}>
              {LOGIN_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="field">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <label style={{ margin: 0 }}>Password</label>
              <Link to="/forgot-password" style={{ fontSize: 12, color: '#1E5FBF', fontWeight: 600, textDecoration: 'none' }}>
                Forgot password?
              </Link>
            </div>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        </form>
        {!hideRegister && (
          <div className="auth-switch">
            No account? <Link to="/register">Create one</Link>
          </div>
        )}
      </div>
    </div>
  );
}
