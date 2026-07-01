import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api.js';

const INDIA_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab',
  'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh',
  'Uttarakhand','West Bengal','Andaman & Nicobar','Chandigarh','Delhi',
  'Dadra & Nagar Haveli','Daman & Diu','Jammu & Kashmir','Ladakh','Lakshadweep','Puducherry',
];

const SECTORS = [
  'Agriculture','Automobile','Banking & Finance','Construction','Education','Electronics',
  'Energy','Healthcare','Hospitality','IT & Software','Logistics','Manufacturing',
  'Media & Entertainment','Retail','Telecom','Textile','Tourism','Other',
];

const QUALIFICATIONS = [
  '10th / SSC','12th / HSC','Diploma','ITI','Graduate (BA/BSc/BCom)',
  'Graduate (BE/BTech)','Post Graduate','MBA','PhD','Other',
];

const LANG_LEVELS = ['None','Basic','Intermediate','Fluent','Native'];

function initForm(u) {
  return {
    first_name: u.first_name || '', middle_name: u.middle_name || '', last_name: u.last_name || '',
    gender: u.gender || '', dob: u.dob || '', category: u.category || '',
    phone: u.phone || '', email: u.email || '',
    address_line1: u.address_line1 || '', address_line2: u.address_line2 || '',
    city: u.city || '', state_name: u.state_name || '', pincode: u.pincode || '',
    qualification: u.qualification || '', year_passed: u.year_passed || '',
    board: u.board || '', university: u.university || '', percentage: u.percentage || '',
    employment_status: u.employment_status || '',
    skillsText: (u.skills || []).join(', '),
    interests: u.interests || '', preferred_sector: u.preferred_sector || '',
    lang_english: u.lang_english || '', lang_hindi: u.lang_hindi || '', lang_regional: u.lang_regional || '',
    photo: u.photo || '',
    certificates: u.certificates ? JSON.parse(u.certificates) : [],
    resume: u.resume || '',
    name: u.name || '', org_name: u.org_name || '',
    location: u.location || '', bio: u.bio || '', experience_years: u.experience_years || 0,
  };
}

function SectionCard({ title, editing, onEdit, onCancel, onSave, busy, savedMsg, error, children }) {
  return (
    <div className="card shadow" style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--ink-3)', letterSpacing: 0.5, textTransform: 'uppercase' }}>
          {title}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {savedMsg && <span style={{ fontSize: 12, color: '#10B981', fontWeight: 600 }}>✓ Saved</span>}
          {!editing
            ? <button type="button" className="btn btn-outline btn-sm" onClick={onEdit}>Edit</button>
            : <>
                <button type="button" className="btn btn-outline btn-sm" onClick={onCancel} disabled={busy}>Cancel</button>
                <button type="button" className="btn btn-primary btn-sm" onClick={onSave} disabled={busy}>
                  {busy ? 'Saving…' : 'Save'}
                </button>
              </>
          }
        </div>
      </div>
      {error && <div className="error-msg" style={{ marginBottom: 10 }}>{error}</div>}
      <div style={{ opacity: editing ? 1 : 0.85 }}>
        {children}
      </div>
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <div className="field">
      <label>{label}{required && <span style={{ color: '#EF4444', marginLeft: 3 }}>*</span>}</label>
      {children}
    </div>
  );
}

function ReadOnly({ label, value }) {
  return (
    <div className="field">
      <label style={{ fontSize: 12, color: 'var(--ink-3)' }}>{label}</label>
      <div style={{ fontSize: 14, color: 'var(--ink-1)', padding: '6px 0', minHeight: 24 }}>{value || <span style={{ color: 'var(--ink-3)' }}>—</span>}</div>
    </div>
  );
}

export default function Profile() {
  const { user, refresh } = useAuth();
  const isCandidate = user.role === 'candidate';

  const [f, setF] = useState(() => initForm(user));
  const [snap, setSnap] = useState(() => initForm(user)); // snapshot for cancel
  const [editing, setEditing] = useState({});
  const [busy, setBusy] = useState({});
  const [errors, setErrors] = useState({});
  const [savedMsg, setSavedMsg] = useState({});

  const photoRef = useRef();
  const certRef = useRef();
  const resumeRef = useRef();

  const set = (k, v) => setF(prev => ({ ...prev, [k]: v }));

  function startEdit(section) {
    setSnap({ ...f });
    setEditing(e => ({ ...e, [section]: true }));
    setErrors(e => ({ ...e, [section]: '' }));
  }

  function cancelEdit(section) {
    setF({ ...snap });
    setEditing(e => ({ ...e, [section]: false }));
    setErrors(e => ({ ...e, [section]: '' }));
  }

  async function saveSection(section, payload) {
    setBusy(b => ({ ...b, [section]: true }));
    setErrors(e => ({ ...e, [section]: '' }));
    try {
      const updated = await api.updateMe({
        ...payload,
        name: [f.first_name, f.middle_name, f.last_name].filter(Boolean).join(' ') || f.name,
      });
      const newF = initForm(updated);
      setF(newF);
      setSnap(newF);
      await refresh();
      setEditing(e => ({ ...e, [section]: false }));
      setSavedMsg(s => ({ ...s, [section]: true }));
      setTimeout(() => setSavedMsg(s => ({ ...s, [section]: false })), 2500);
    } catch (err) {
      setErrors(e => ({ ...e, [section]: err.message }));
    } finally {
      setBusy(b => ({ ...b, [section]: false }));
    }
  }

  // Certificate helpers
  function addCertificates(files) {
    Array.from(files).forEach(file => {
      if (file.size > 5 * 1024 * 1024) { setErrors(e => ({ ...e, documents: 'Each file must be under 5MB' })); return; }
      const reader = new FileReader();
      reader.onload = (ev) => {
        setF(prev => ({
          ...prev,
          certificates: [...prev.certificates, { name: file.name, data: ev.target.result }],
        }));
      };
      reader.readAsDataURL(file);
    });
  }

  function removeCert(idx) {
    setF(prev => ({ ...prev, certificates: prev.certificates.filter((_, i) => i !== idx) }));
  }

  function readFile(file, key) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setErrors(e => ({ ...e, documents: 'File must be under 5MB' })); return; }
    const reader = new FileReader();
    reader.onload = (ev) => set(key, ev.target.result);
    reader.readAsDataURL(file);
  }

  if (!isCandidate) {
    return (
      <div className="page" style={{ maxWidth: 640 }}>
        <div className="page-header"><h1>My Profile</h1></div>
        <div className="card shadow">
          <Field label="Name"><input value={f.name} onChange={e => set('name', e.target.value)} /></Field>
          <Field label="Email"><input value={f.email} disabled /></Field>
          <Field label="Organization"><input value={f.org_name} onChange={e => set('org_name', e.target.value)} /></Field>
          <Field label="Location"><input value={f.location} onChange={e => set('location', e.target.value)} /></Field>
          <Field label="Bio"><textarea value={f.bio} onChange={e => set('bio', e.target.value)} /></Field>
          <button className="btn btn-primary" onClick={() => saveSection('main', { name: f.name, org_name: f.org_name, location: f.location, bio: f.bio })} disabled={busy.main}>
            {busy.main ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    );
  }

  const ed = editing;

  return (
    <div className="page" style={{ maxWidth: 760 }}>
      <div className="page-header">
        <h1>My Profile</h1>
        <p>Keep your details current for better job matches.</p>
      </div>

      {/* ── PERSONAL DETAILS ── */}
      <SectionCard title="Personal Details"
        editing={ed.personal} onEdit={() => startEdit('personal')}
        onCancel={() => cancelEdit('personal')}
        onSave={() => saveSection('personal', { first_name: f.first_name, middle_name: f.middle_name, last_name: f.last_name, gender: f.gender, dob: f.dob, category: f.category })}
        busy={busy.personal} savedMsg={savedMsg.personal} error={errors.personal}>
        {ed.personal ? (
          <>
            <div className="grid grid-3">
              <Field label="First Name"><input value={f.first_name} onChange={e => set('first_name', e.target.value)} placeholder="First name" /></Field>
              <Field label="Middle Name"><input value={f.middle_name} onChange={e => set('middle_name', e.target.value)} placeholder="Middle name" /></Field>
              <Field label="Last Name"><input value={f.last_name} onChange={e => set('last_name', e.target.value)} placeholder="Last name" /></Field>
            </div>
            <div className="grid grid-2">
              <Field label="Gender">
                <select value={f.gender} onChange={e => set('gender', e.target.value)}>
                  <option value="">Select gender</option>
                  <option>Male</option><option>Female</option><option>Transgender</option><option>Prefer not to say</option>
                </select>
              </Field>
              <Field label="Date of Birth">
                <input type="date" value={f.dob} onChange={e => set('dob', e.target.value)}
                  max={new Date(Date.now() - 16 * 365.25 * 86400000).toISOString().split('T')[0]} />
              </Field>
            </div>
            <Field label="Category">
              <select value={f.category} onChange={e => set('category', e.target.value)}>
                <option value="">Select category</option>
                <option>General</option><option>OBC</option><option>SC</option><option>ST</option><option>EWS</option>
              </select>
            </Field>
          </>
        ) : (
          <div className="grid grid-2">
            <ReadOnly label="Name" value={[f.first_name, f.middle_name, f.last_name].filter(Boolean).join(' ')} />
            <ReadOnly label="Gender" value={f.gender} />
            <ReadOnly label="Date of Birth" value={f.dob} />
            <ReadOnly label="Category" value={f.category} />
          </div>
        )}
      </SectionCard>

      {/* ── CONTACT INFORMATION ── */}
      <SectionCard title="Contact Information"
        editing={ed.contact} onEdit={() => startEdit('contact')}
        onCancel={() => cancelEdit('contact')}
        onSave={() => saveSection('contact', { phone: f.phone, address_line1: f.address_line1, address_line2: f.address_line2, city: f.city, state_name: f.state_name, pincode: f.pincode })}
        busy={busy.contact} savedMsg={savedMsg.contact} error={errors.contact}>
        {ed.contact ? (
          <>
            <div className="grid grid-2">
              <Field label="Mobile"><input value={f.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 XXXXXXXXXX" /></Field>
              <Field label="Email"><input value={f.email} disabled style={{ background: '#f1f5f9' }} /></Field>
            </div>
            <Field label="Address Line 1"><input value={f.address_line1} onChange={e => set('address_line1', e.target.value)} placeholder="House / Flat No., Street, Area" /></Field>
            <Field label="Address Line 2"><input value={f.address_line2} onChange={e => set('address_line2', e.target.value)} placeholder="Landmark, Colony (optional)" /></Field>
            <div className="grid grid-2">
              <Field label="District / City"><input value={f.city} onChange={e => set('city', e.target.value)} placeholder="City / District" /></Field>
              <Field label="State">
                <select value={f.state_name} onChange={e => set('state_name', e.target.value)}>
                  <option value="">Select state</option>
                  {INDIA_STATES.map(s => <option key={s}>{s}</option>)}
                </select>
              </Field>
            </div>
            <Field label="PIN Code"><input value={f.pincode} onChange={e => set('pincode', e.target.value.replace(/\D/g,'').slice(0,6))} placeholder="6-digit PIN" style={{ maxWidth: 180 }} /></Field>
          </>
        ) : (
          <div className="grid grid-2">
            <ReadOnly label="Mobile" value={f.phone} />
            <ReadOnly label="Email" value={f.email} />
            <ReadOnly label="Address" value={[f.address_line1, f.address_line2].filter(Boolean).join(', ')} />
            <ReadOnly label="District" value={f.city} />
            <ReadOnly label="State" value={f.state_name} />
            <ReadOnly label="PIN" value={f.pincode} />
          </div>
        )}
      </SectionCard>

      {/* ── EDUCATION ── */}
      <SectionCard title="Education"
        editing={ed.education} onEdit={() => startEdit('education')}
        onCancel={() => cancelEdit('education')}
        onSave={() => saveSection('education', { qualification: f.qualification, year_passed: f.year_passed, board: f.board, university: f.university, percentage: f.percentage })}
        busy={busy.education} savedMsg={savedMsg.education} error={errors.education}>
        {ed.education ? (
          <>
            <div className="grid grid-2">
              <Field label="Highest Qualification">
                <select value={f.qualification} onChange={e => set('qualification', e.target.value)}>
                  <option value="">Select qualification</option>
                  {QUALIFICATIONS.map(q => <option key={q}>{q}</option>)}
                </select>
              </Field>
              <Field label="Year Passed"><input value={f.year_passed} onChange={e => set('year_passed', e.target.value)} placeholder="e.g. 2022" maxLength={4} /></Field>
            </div>
            <div className="grid grid-2">
              <Field label="Board"><input value={f.board} onChange={e => set('board', e.target.value)} placeholder="e.g. CBSE, State Board" /></Field>
              <Field label="University / Institute"><input value={f.university} onChange={e => set('university', e.target.value)} placeholder="University or college name" /></Field>
            </div>
            <Field label="Percentage / CGPA"><input value={f.percentage} onChange={e => set('percentage', e.target.value)} placeholder="e.g. 75% or 8.5 CGPA" style={{ maxWidth: 220 }} /></Field>
          </>
        ) : (
          <div className="grid grid-2">
            <ReadOnly label="Highest Qualification" value={f.qualification} />
            <ReadOnly label="Year Passed" value={f.year_passed} />
            <ReadOnly label="Board" value={f.board} />
            <ReadOnly label="University / Institute" value={f.university} />
            <ReadOnly label="Percentage / CGPA" value={f.percentage} />
          </div>
        )}
      </SectionCard>

      {/* ── EMPLOYMENT STATUS ── */}
      <SectionCard title="Employment Status"
        editing={ed.employment} onEdit={() => startEdit('employment')}
        onCancel={() => cancelEdit('employment')}
        onSave={() => saveSection('employment', { employment_status: f.employment_status })}
        busy={busy.employment} savedMsg={savedMsg.employment} error={errors.employment}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {['Student','Fresher','Employed','Self-employed','Unemployed'].map(s => {
            const selected = f.employment_status === s;
            return (
              <div key={s}
                onClick={() => ed.employment && set('employment_status', s)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '9px 18px', borderRadius: 99, fontSize: 13, fontWeight: 600,
                  cursor: ed.employment ? 'pointer' : 'default',
                  border: '2px solid ' + (selected ? '#10B981' : 'var(--border)'),
                  background: selected ? '#ECFDF5' : '#F9FAFB',
                  color: selected ? '#065F46' : 'var(--ink-3)',
                  transition: 'all .15s',
                  userSelect: 'none',
                }}>
                <span style={{
                  width: 18, height: 18, borderRadius: '50%', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0,
                  background: selected ? '#10B981' : '#E5E7EB',
                  color: selected ? '#fff' : '#9CA3AF',
                }}>
                  {selected ? '✓' : '○'}
                </span>
                {s}
              </div>
            );
          })}
        </div>
        {!f.employment_status && (
          <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 10 }}>
            {ed.employment ? 'Select your current employment status.' : 'Not specified'}
          </div>
        )}
      </SectionCard>

      {/* ── SKILLS ── */}
      <SectionCard title="Skills"
        editing={ed.skills} onEdit={() => startEdit('skills')}
        onCancel={() => cancelEdit('skills')}
        onSave={() => saveSection('skills', { skills: f.skillsText.split(',').map(s => s.trim()).filter(Boolean), interests: f.interests, preferred_sector: f.preferred_sector })}
        busy={busy.skills} savedMsg={savedMsg.skills} error={errors.skills}>
        {ed.skills ? (
          <>
            <Field label="Existing Skills (comma separated)"><input value={f.skillsText} onChange={e => set('skillsText', e.target.value)} placeholder="e.g. SQL, Excel, Communication" /></Field>
            <Field label="Interests"><input value={f.interests} onChange={e => set('interests', e.target.value)} placeholder="e.g. Data analysis, Web development" /></Field>
            <Field label="Preferred Sector">
              <select value={f.preferred_sector} onChange={e => set('preferred_sector', e.target.value)}>
                <option value="">Select preferred sector</option>
                {SECTORS.map(s => <option key={s}>{s}</option>)}
              </select>
            </Field>
          </>
        ) : (
          <>
            <ReadOnly label="Skills" value={f.skillsText} />
            <ReadOnly label="Interests" value={f.interests} />
            <ReadOnly label="Preferred Sector" value={f.preferred_sector} />
          </>
        )}
      </SectionCard>

      {/* ── LANGUAGES ── */}
      <SectionCard title="Languages"
        editing={ed.languages} onEdit={() => startEdit('languages')}
        onCancel={() => cancelEdit('languages')}
        onSave={() => saveSection('languages', { lang_english: f.lang_english, lang_hindi: f.lang_hindi, lang_regional: f.lang_regional })}
        busy={busy.languages} savedMsg={savedMsg.languages} error={errors.languages}>
        {ed.languages ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
            <Field label="English">
              <select value={f.lang_english} onChange={e => set('lang_english', e.target.value)}>
                <option value="">Select level</option>
                {LANG_LEVELS.map(l => <option key={l}>{l}</option>)}
              </select>
            </Field>
            <Field label="Hindi">
              <select value={f.lang_hindi} onChange={e => set('lang_hindi', e.target.value)}>
                <option value="">Select level</option>
                {LANG_LEVELS.map(l => <option key={l}>{l}</option>)}
              </select>
            </Field>
            <Field label="Regional Language">
              <input value={f.lang_regional} onChange={e => set('lang_regional', e.target.value)} placeholder="e.g. Telugu — Fluent" />
            </Field>
          </div>
        ) : (
          <div className="grid grid-2">
            <ReadOnly label="English" value={f.lang_english} />
            <ReadOnly label="Hindi" value={f.lang_hindi} />
            <ReadOnly label="Regional Language" value={f.lang_regional} />
          </div>
        )}
      </SectionCard>

      {/* ── DOCUMENTS ── */}
      <SectionCard title="Documents"
        editing={ed.documents} onEdit={() => startEdit('documents')}
        onCancel={() => cancelEdit('documents')}
        onSave={() => saveSection('documents', { photo: f.photo, certificates: JSON.stringify(f.certificates), resume: f.resume })}
        busy={busy.documents} savedMsg={savedMsg.documents} error={errors.documents}>
        <div style={{ display: 'grid', gap: 20 }}>

          {/* Photograph */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div onClick={() => ed.documents && photoRef.current.click()}
              style={{
                width: 72, height: 72, borderRadius: '50%', border: '2px dashed var(--border)',
                background: f.photo ? `url(${f.photo}) center/cover` : '#F8FAFC',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24, cursor: ed.documents ? 'pointer' : 'default',
                flexShrink: 0, overflow: 'hidden',
              }}>
              {!f.photo && '📷'}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>Photograph</div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 6 }}>JPG/PNG, max 5MB</div>
              {ed.documents && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => photoRef.current.click()}>
                    {f.photo ? 'Change' : 'Upload'}
                  </button>
                  {f.photo && <button type="button" className="btn btn-sm" style={{ color: '#EF4444' }} onClick={() => set('photo', '')}>Remove</button>}
                </div>
              )}
              {!ed.documents && f.photo && <span style={{ fontSize: 12, color: '#10B981', fontWeight: 600 }}>✓ Uploaded</span>}
              {!ed.documents && !f.photo && <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>Not uploaded</span>}
            </div>
            <input ref={photoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => readFile(e.target.files[0], 'photo')} />
          </div>

          {/* Certificates — multiple */}
          <div>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>Certificates</div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 10 }}>PDF/JPG/PNG, max 5MB each — multiple files allowed</div>
            {f.certificates.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
                {f.certificates.map((cert, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#F8FAFC', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px' }}>
                    <span style={{ fontSize: 18 }}>📜</span>
                    <span style={{ fontSize: 13, flex: 1, color: 'var(--ink-1)', wordBreak: 'break-all' }}>{cert.name}</span>
                    <span style={{ fontSize: 12, color: '#10B981', fontWeight: 600 }}>✓</span>
                    {ed.documents && (
                      <button type="button" onClick={() => removeCert(i)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', fontSize: 16, lineHeight: 1, padding: '0 4px' }}>×</button>
                    )}
                  </div>
                ))}
              </div>
            )}
            {ed.documents && (
              <button type="button" className="btn btn-outline btn-sm" onClick={() => certRef.current.click()}>
                + Add Certificate
              </button>
            )}
            {!ed.documents && f.certificates.length === 0 && <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>No certificates uploaded</span>}
            <input ref={certRef} type="file" accept=".pdf,image/*" multiple style={{ display: 'none' }}
              onChange={e => { addCertificates(e.target.files); e.target.value = ''; }} />
          </div>

          {/* Resume */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 72, height: 72, borderRadius: 10, border: '2px dashed var(--border)', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0 }}>
              📄
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>Resume / CV</div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 6 }}>PDF, max 5MB</div>
              {ed.documents && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => resumeRef.current.click()}>
                    {f.resume ? 'Change' : 'Upload'}
                  </button>
                  {f.resume && <button type="button" className="btn btn-sm" style={{ color: '#EF4444' }} onClick={() => set('resume', '')}>Remove</button>}
                </div>
              )}
              {!ed.documents && f.resume && <span style={{ fontSize: 12, color: '#10B981', fontWeight: 600 }}>✓ Uploaded</span>}
              {!ed.documents && !f.resume && <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>Not uploaded</span>}
            </div>
            <input ref={resumeRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => readFile(e.target.files[0], 'resume')} />
          </div>

        </div>
      </SectionCard>
    </div>
  );
}
