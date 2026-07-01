import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api.js';

const emptyForm = { title: '', provider: '', tagsText: '', duration_weeks: 4, level: 'Beginner' };

export default function Courses() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [mine, setMine] = useState(new Set());
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState('');

  function load() {
    api.courses().then(setCourses);
    if (user.role === 'candidate') {
      api.myEnrollments().then(rows => setMine(new Set(rows.map(r => r.course_id))));
    }
  }
  useEffect(() => { load(); }, []);

  function notify(msg) { setToast(msg); setTimeout(() => setToast(''), 2500); }

  async function enroll(c) {
    try {
      await api.enroll(c.id);
      setMine(s => new Set([...s, c.id]));
      notify(`Enrolled in ${c.title}`);
    } catch (e) { notify(e.message); }
  }

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function submit(e) {
    e.preventDefault();
    const skill_tags = form.tagsText.split(',').map(s => s.trim()).filter(Boolean);
    await api.createCourse({ ...form, skill_tags, duration_weeks: Number(form.duration_weeks) });
    setForm(emptyForm); setShowForm(false); load();
  }

  return (
    <div className="page">
      <div className="row-between page-header">
        <div>
          <h1>Courses</h1>
          <p>Skill-building courses mapped to in-demand job requirements.</p>
        </div>
        {(user.role === 'trainer' || user.role === 'admin') && (
          <button className="btn btn-primary" onClick={() => setShowForm(s => !s)}>{showForm ? 'Cancel' : '+ Add course'}</button>
        )}
      </div>

      {showForm && (
        <form className="card shadow" onSubmit={submit} style={{ marginBottom: 22 }}>
          <div className="grid grid-2">
            <div className="field"><label>Course title</label><input value={form.title} onChange={e => set('title', e.target.value)} required /></div>
            <div className="field"><label>Provider</label><input value={form.provider} onChange={e => set('provider', e.target.value)} placeholder={user.org_name || user.name} /></div>
          </div>
          <div className="field"><label>Skill tags (comma separated)</label><input value={form.tagsText} onChange={e => set('tagsText', e.target.value)} placeholder="e.g. SQL, Excel" /></div>
          <div className="grid grid-2">
            <div className="field"><label>Duration (weeks)</label><input type="number" min="1" value={form.duration_weeks} onChange={e => set('duration_weeks', e.target.value)} /></div>
            <div className="field">
              <label>Level</label>
              <select value={form.level} onChange={e => set('level', e.target.value)}>
                <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
              </select>
            </div>
          </div>
          <button className="btn btn-primary">Publish course</button>
        </form>
      )}

      <div className="grid grid-3">
        {courses.map(c => (
          <div className="card shadow" key={c.id}>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 4 }}>{c.provider}</div>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>{c.title}</div>
            <div className="chip-row" style={{ marginBottom: 10 }}>{c.skill_tags.map(s => <span className="chip" key={s}>{s}</span>)}</div>
            <div className="row-between" style={{ marginBottom: 12 }}>
              <span className="badge b-blue">{c.level}</span>
              <span className="muted">{c.duration_weeks} wks · ★ {c.rating}</span>
            </div>
            {user.role === 'candidate' && (
              <button className="btn btn-outline btn-block btn-sm" disabled={mine.has(c.id)} onClick={() => enroll(c)}>
                {mine.has(c.id) ? 'Enrolled ✓' : 'Enroll'}
              </button>
            )}
          </div>
        ))}
      </div>

      <div className={'toast' + (toast ? ' show' : '')}>{toast}</div>
    </div>
  );
}
