import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api.js';

export default function Profile() {
  const { user, refresh } = useAuth();
  const [form, setForm] = useState({
    name: user.name, location: user.location || '', bio: user.bio || '',
    experience_years: user.experience_years || 0, org_name: user.org_name || '',
    skillsText: (user.skills || []).join(', ')
  });
  const [saved, setSaved] = useState(false);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function save(e) {
    e.preventDefault();
    const skills = form.skillsText.split(',').map(s => s.trim()).filter(Boolean);
    await api.updateMe({
      name: form.name, location: form.location, bio: form.bio,
      experience_years: Number(form.experience_years), org_name: form.org_name, skills
    });
    await refresh();
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="page" style={{ maxWidth: 640 }}>
      <div className="page-header">
        <h1>My profile</h1>
        <p>Keep your details current for better matches.</p>
      </div>
      <form className="card shadow" onSubmit={save}>
        {saved && <div className="badge b-teal" style={{ marginBottom: 14 }}>Saved ✓</div>}
        <div className="field"><label>Name</label><input value={form.name} onChange={e => set('name', e.target.value)} /></div>
        <div className="field"><label>Email</label><input value={user.email} disabled /></div>
        {user.role !== 'candidate' && (
          <div className="field"><label>Organization</label><input value={form.org_name} onChange={e => set('org_name', e.target.value)} /></div>
        )}
        <div className="field"><label>Location</label><input value={form.location} onChange={e => set('location', e.target.value)} /></div>
        <div className="field"><label>Bio</label><textarea value={form.bio} onChange={e => set('bio', e.target.value)} /></div>
        {user.role === 'candidate' && (
          <>
            <div className="field"><label>Experience (years)</label><input type="number" step="0.5" value={form.experience_years} onChange={e => set('experience_years', e.target.value)} /></div>
            <div className="field"><label>Skills (comma separated)</label><input value={form.skillsText} onChange={e => set('skillsText', e.target.value)} /></div>
          </>
        )}
        <button className="btn btn-primary">Save changes</button>
      </form>
    </div>
  );
}
