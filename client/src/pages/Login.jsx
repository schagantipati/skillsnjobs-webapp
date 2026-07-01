import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('aisha@example.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError(''); setBusy(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-logo"><div className="mark">🎯</div><span>SkillsNJobs</span></div>
        <h2>Welcome back</h2>
        <p className="sub">Sign in to continue your skill-to-career journey.</p>
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={submit}>
          <div className="field">
            <label>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        </form>
        <div className="auth-switch">
          No account? <Link to="/register">Create one</Link>
        </div>
        <div className="hint" style={{ marginTop: 16, textAlign: 'center' }}>
          Demo logins (password: <strong>password123</strong>): aisha@example.com (candidate) · hr@technova.com (employer) · trainer@skillbridge.in (trainer)
        </div>
      </div>
    </div>
  );
}
