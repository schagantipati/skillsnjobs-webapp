import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../api.js';

export default function ResetPassword() {
  const [params]      = useSearchParams();
  const navigate      = useNavigate();
  const token         = params.get('token') || '';

  const [password, setPassword]     = useState('');
  const [confirm, setConfirm]       = useState('');
  const [showPw, setShowPw]         = useState(false);
  const [busy, setBusy]             = useState(false);
  const [done, setDone]             = useState(false);
  const [error, setError]           = useState('');

  async function submit(e) {
    e.preventDefault();
    if (!password) return setError('Please enter a new password.');
    if (password.length < 6) return setError('Password must be at least 6 characters.');
    if (password !== confirm) return setError('Passwords do not match.');
    if (!token) return setError('Reset token is missing. Please use the link from your email.');
    setBusy(true); setError('');
    try {
      await api.resetPassword(token, password);
      setDone(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (!token) {
    return (
      <div className="auth-wrap">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
          <h2>Invalid Link</h2>
          <p className="sub">This reset link is invalid or missing. Please request a new one.</p>
          <Link to="/forgot-password" className="btn btn-primary btn-block" style={{ display: 'block', textAlign: 'center', marginTop: 16 }}>
            Request New Link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-logo"><img src="/logo.png" alt="Skills n Jobs" style={{ height:48, width:48, objectFit:'contain' }} /><span>SkillsNJobs</span></div>

        {!done ? (
          <>
            <h2>Reset Password</h2>
            <p className="sub">Enter your new password below. Must be at least 6 characters.</p>
            {error && <div className="error-msg">{error}</div>}
            <form onSubmit={submit}>
              <div className="field" style={{ position: 'relative' }}>
                <label>New Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    required
                    autoFocus
                    style={{ paddingRight: 40 }}
                  />
                  <button type="button" onClick={() => setShowPw(s => !s)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#9CA3AF' }}>
                    {showPw ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
              <div className="field">
                <label>Confirm New Password</label>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Re-enter new password"
                  required
                />
              </div>

              {/* Password strength indicator */}
              {password && (
                <div style={{ marginBottom: 14 }}>
                  {(() => {
                    const score = [password.length >= 8, /[A-Z]/.test(password), /[0-9]/.test(password), /[^A-Za-z0-9]/.test(password)].filter(Boolean).length;
                    const labels = ['Too short','Weak','Fair','Good','Strong'];
                    const colors = ['#EF4444','#F97316','#EAB308','#22C55E','#15803D'];
                    return (
                      <div>
                        <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                          {[0,1,2,3].map(i => (
                            <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i < score ? colors[score] : '#E5E7EB', transition: 'background .2s' }} />
                          ))}
                        </div>
                        <div style={{ fontSize: 11, color: colors[score], fontWeight: 700 }}>{labels[score]}</div>
                      </div>
                    );
                  })()}
                </div>
              )}

              <button className="btn btn-primary btn-block" disabled={busy}>
                {busy ? 'Resetting…' : 'Reset Password'}
              </button>
            </form>
            <div className="auth-switch" style={{ marginTop: 16 }}>
              <Link to="/login">← Back to Sign In</Link>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>✅</div>
            <h2 style={{ marginBottom: 8 }}>Password Reset!</h2>
            <p className="sub">Your password has been updated successfully. Redirecting you to sign in…</p>
            <Link to="/login" className="btn btn-primary btn-block" style={{ display: 'block', textAlign: 'center', marginTop: 20 }}>
              Sign In Now
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
