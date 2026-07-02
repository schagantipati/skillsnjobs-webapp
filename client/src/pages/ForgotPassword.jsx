import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';

export default function ForgotPassword() {
  const [email, setEmail]   = useState('');
  const [busy, setBusy]     = useState(false);
  const [done, setDone]     = useState(false);
  const [devToken, setDevToken] = useState('');
  const [error, setError]   = useState('');

  async function submit(e) {
    e.preventDefault();
    if (!email) return setError('Please enter your email address.');
    setBusy(true); setError('');
    try {
      const res = await api.forgotPassword(email);
      setDone(true);
      if (res.dev_token) setDevToken(res.dev_token);
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

        {!done ? (
          <>
            <h2>Forgot Password</h2>
            <p className="sub">Enter your registered email address and we'll send you a reset link.</p>
            {error && <div className="error-msg">{error}</div>}
            <form onSubmit={submit}>
              <div className="field">
                <label>Email Address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com" required autoFocus />
              </div>
              <button className="btn btn-primary btn-block" disabled={busy}>
                {busy ? 'Sending…' : 'Send Reset Link'}
              </button>
            </form>
            <div className="auth-switch" style={{ marginTop: 16 }}>
              <Link to="/login">← Back to Sign In</Link>
            </div>
          </>
        ) : (
          <>
            <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📧</div>
              <h2 style={{ marginBottom: 8 }}>Check your email</h2>
              <p className="sub">
                If <strong>{email}</strong> is registered, a password reset link has been sent. Check your inbox (and spam folder).
              </p>
            </div>

            {/* Dev-mode token — remove in production */}
            {devToken && (
              <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 10, padding: '14px 16px', marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#15803D', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Dev Mode — Reset Link
                </div>
                <Link
                  to={`/reset-password?token=${devToken}`}
                  style={{ fontSize: 13, color: '#15803D', fontWeight: 700, wordBreak: 'break-all' }}>
                  Click here to reset password →
                </Link>
                <div style={{ fontSize: 11, color: '#6B7280', marginTop: 6 }}>
                  (This link is shown only in development. In production, it would be sent by email.)
                </div>
              </div>
            )}

            <Link to="/login" className="btn btn-primary btn-block" style={{ textAlign: 'center', display: 'block' }}>
              Back to Sign In
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
