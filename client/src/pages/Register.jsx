import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const ROLES = [
  { value: 'candidate', label: 'Candidate' },
  { value: 'employer', label: 'Employer' },
  { value: 'trainer', label: 'Trainer' }
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'candidate', org_name: '', location: '', skillsText: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function submit(e) {
    e.preventDefault();
    setError(''); setBusy(true);
    try {
      const skills = form.skillsText.split(',').map(s => s.trim()).filter(Boolean);
      await register({
        name: form.name, email: form.email, password: form.password, role: form.role,
        org_name: form.org_name || null, location: form.location || null, skills
      });
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
        <h2>Create your account</h2>
        <p className="sub">Connect skills, jobs and training in one place.</p>
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={submit}>
          <div className="role-pick">
            {ROLES.map(r => (
              <div key={r.value} className={'role-opt' + (form.role === r.value ? ' active' : '')} onClick={() => set('role', r.value)}>
                {r.label}
              </div>
            ))}
          </div>
          <div className="field">
            <label>Full name</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} required />
          </div>
          <div className="field">
            <label>Email</label>
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)} required />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" value={form.password} onChange={e => set('password', e.target.value)} required minLength={6} />
          </div>
          {form.role !== 'candidate' && (
            <div className="field">
              <label>Organization name</label>
              <input value={form.org_name} onChange={e => set('org_name', e.target.value)} placeholder="e.g. TechNova Pvt Ltd" />
            </div>
          )}
          <div className="field">
            <label>Location</label>
            <input value={form.location} onChange={e => set('location', e.target.value)} placeholder="e.g. Hyderabad" />
          </div>
          {form.role === 'candidate' && (
            <div className="field">
              <label>Skills (comma separated)</label>
              <input value={form.skillsText} onChange={e => set('skillsText', e.target.value)} placeholder="e.g. SQL, Excel, Communication" />
            </div>
          )}
          <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</button>
        </form>
        <div className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
