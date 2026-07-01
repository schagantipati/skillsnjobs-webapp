import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api.js';

const MONTHS_SHORT = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

function DateDMY({ value, onChange, maxYear, minYear = 1900 }) {
  const parts = value ? value.split('-') : ['','',''];
  const day = parts[0] || ''; const month = parts[1] || ''; const year = parts[2] || '';
  const currentYear = new Date().getFullYear();
  const maxY = maxYear || currentYear;
  function update(d, m, y) { if (d && m && y) onChange(`${String(d).padStart(2,'0')}-${m}-${y}`); }
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      <select value={day} onChange={e => update(e.target.value, month, year)} style={{ flex: 1 }}>
        <option value="">DD</option>
        {Array.from({length:31},(_,i)=>String(i+1).padStart(2,'0')).map(d=><option key={d}>{d}</option>)}
      </select>
      <select value={month} onChange={e => update(day, e.target.value, year)} style={{ flex: 1 }}>
        <option value="">MMM</option>
        {MONTHS_SHORT.map(m=><option key={m}>{m}</option>)}
      </select>
      <select value={year} onChange={e => update(day, month, e.target.value)} style={{ flex: 1.4 }}>
        <option value="">YYYY</option>
        {Array.from({length: maxY - minYear + 1},(_,i)=>String(maxY-i)).map(y=><option key={y}>{y}</option>)}
      </select>
    </div>
  );
}

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
    // Vendor-specific
    registration_number: u.registration_number || '', pan: u.pan || '', gstin: u.gstin || '',
    year_established: u.year_established || '', head_office: u.head_office || '',
    branch_offices: u.branch_offices || '',
    ceo_name: u.ceo_name || '', spoc_name: u.spoc_name || '', ops_head: u.ops_head || '',
    finance_contact: u.finance_contact || '', placement_officer: u.placement_officer || '',
    bank_account_name: u.bank_account_name || '', bank_ifsc: u.bank_ifsc || '',
    bank_account_number: u.bank_account_number || '',
    training_centres: u.training_centres || '[]', centre_photos: u.centre_photos || '[]',
  };
}

function SectionCard({ title, editing, onEdit, onCancel, onSave, busy, savedMsg, error, children }) {
  return (
    <div className="card shadow" style={{ marginBottom: 0, padding: 0, overflow: 'hidden', height: '100%', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#6B9EF0', padding: '7px 12px', borderBottom: '1px solid #5A8FE8' }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: '#ffffff', letterSpacing: 0.4, textTransform: 'uppercase' }}>
          {title}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {savedMsg && <span style={{ fontSize: 12, color: '#10B981', fontWeight: 600 }}>✓ Saved</span>}
          {!editing
            ? <button type="button" className="btn btn-sm" style={{ background: '#fff', color: '#6B9EF0', border: '1.5px solid #fff', fontWeight: 700, borderRadius: 7 }} onClick={onEdit}>✏️ Edit</button>
            : <>
                <button type="button" className="btn btn-sm" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: '1.5px solid rgba(255,255,255,0.5)', borderRadius: 7 }} onClick={onCancel} disabled={busy}>Cancel</button>
                <button type="button" className="btn btn-sm" style={{ background: '#fff', color: '#6B9EF0', border: '1.5px solid #fff', fontWeight: 700, borderRadius: 7 }} onClick={onSave} disabled={busy}>
                  {busy ? 'Saving…' : '✓ Save'}
                </button>
              </>
          }
        </div>
      </div>
      <div style={{ padding: '8px 12px' }}>
        {error && <div className="error-msg" style={{ marginBottom: 10 }}>{error}</div>}
        <div style={{ opacity: editing ? 1 : 0.85 }}>
          {children}
        </div>
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
      <div style={{ fontSize: 13, color: 'var(--ink-1)', padding: '2px 0', minHeight: 18 }}>{value || <span style={{ color: 'var(--ink-3)' }}>—</span>}</div>
    </div>
  );
}

const ORG_TYPES = ['Private Limited Company','Public Limited Company','Partnership Firm','Sole Proprietorship','LLP (Limited Liability Partnership)','Society / Trust / NGO','Government Institution','Autonomous Body','Other'];

function VendorProfile({ f, set, ed, startEdit, cancelEdit, saveSection, busy, savedMsg, errors, certRef, photoRef, addCertificates, removeCert, readFile, parseArr }) {
  const displayName = f.org_name || f.first_name || 'Training Vendor';

  /* training centres helpers */
  const centres = parseArr(f.training_centres);
  function updateCentre(idx, key, val) {
    const arr = [...centres]; arr[idx] = { ...arr[idx], [key]: val };
    set('training_centres', JSON.stringify(arr));
  }
  function addCentre() {
    const arr = [...centres, { name:'', address:'', geo:'', classrooms:'', labs:'', workshop:'', seating:'', internet:'', power_backup:'', accessibility:'', equipment:'' }];
    set('training_centres', JSON.stringify(arr));
  }
  function removeCentre(idx) {
    set('training_centres', JSON.stringify(centres.filter((_,i)=>i!==idx)));
  }

  /* centre photos helpers */
  const cPhotos = parseArr(f.centre_photos);
  const PHOTO_TYPES = ['Building','Labs','Classrooms','Practical Labs','Reception'];
  function readCentrePhoto(file, label) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const arr = cPhotos.filter(p=>p.label!==label);
      arr.push({ label, data: ev.target.result, name: file.name });
      set('centre_photos', JSON.stringify(arr));
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="page" style={{ maxWidth: 1100 }}>
      <div className="page-header">
        <h1>{displayName}</h1>
        <p>Complete your organisation profile to attract candidates and partners.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, alignItems: 'stretch' }}>

      {/* ── 1. ORGANISATION DETAILS ── */}
      <SectionCard title="Organisation Details"
        editing={ed.orgdetails} onEdit={() => startEdit('orgdetails')}
        onCancel={() => cancelEdit('orgdetails')}
        onSave={() => saveSection('orgdetails', { org_name: f.org_name, registration_number: f.registration_number, pan: f.pan, gstin: f.gstin, gender: f.gender, dob: f.dob, year_established: f.year_established })}
        busy={busy.orgdetails} savedMsg={savedMsg.orgdetails} error={errors.orgdetails}>
        {ed.orgdetails ? (
          <>
            <div className="grid grid-2">
              <Field label="Legal Entity Name" required><input value={f.org_name} onChange={e=>set('org_name',e.target.value)} placeholder="Registered legal name" /></Field>
              <Field label="Registration Number"><input value={f.registration_number||''} onChange={e=>set('registration_number',e.target.value)} placeholder="CIN / Society Reg. No." /></Field>
            </div>
            <div className="grid grid-3">
              <Field label="PAN"><input value={f.pan||''} onChange={e=>set('pan',e.target.value.toUpperCase())} placeholder="AAAAA9999A" maxLength={10} /></Field>
              <Field label="GSTIN"><input value={f.gstin||''} onChange={e=>set('gstin',e.target.value.toUpperCase())} placeholder="22AAAAA0000A1Z5" maxLength={15} /></Field>
              <Field label="Organisation Type">
                <select value={f.gender||''} onChange={e=>set('gender',e.target.value)}>
                  <option value="">Select type</option>
                  {ORG_TYPES.map(t=><option key={t}>{t}</option>)}
                </select>
              </Field>
            </div>
            <div className="grid grid-2">
              <Field label="Date of Incorporation">
                <DateDMY value={f.dob} onChange={v=>set('dob',v)} maxYear={new Date().getFullYear()} />
              </Field>
              <Field label="Year of Establishment"><input value={f.year_established||''} onChange={e=>set('year_established',e.target.value)} placeholder="e.g. 2010" maxLength={4} /></Field>
            </div>
          </>
        ) : (
          <div className="grid grid-2">
            <ReadOnly label="Legal Entity Name" value={f.org_name} />
            <ReadOnly label="Registration Number" value={f.registration_number} />
            <ReadOnly label="PAN" value={f.pan} />
            <ReadOnly label="GSTIN" value={f.gstin} />
            <ReadOnly label="Organisation Type" value={f.gender} />
            <ReadOnly label="Date of Incorporation" value={f.dob} />
            <ReadOnly label="Year of Establishment" value={f.year_established} />
          </div>
        )}
      </SectionCard>

      {/* ── 2. CONTACT DETAILS ── */}
      <SectionCard title="Contact Details"
        editing={ed.vendorcontact} onEdit={() => startEdit('vendorcontact')}
        onCancel={() => cancelEdit('vendorcontact')}
        onSave={() => saveSection('vendorcontact', { phone: f.phone, address_line1: f.address_line1, address_line2: f.address_line2, head_office: f.head_office, branch_offices: f.branch_offices, city: f.city, state_name: f.state_name, pincode: f.pincode })}
        busy={busy.vendorcontact} savedMsg={savedMsg.vendorcontact} error={errors.vendorcontact}>
        {ed.vendorcontact ? (
          <>
            <Field label="Phone"><input value={f.phone||''} onChange={e=>set('phone',e.target.value)} placeholder="+91 XXXXXXXXXX" /></Field>
            <Field label="Registered Address (Line 1)"><input value={f.address_line1||''} onChange={e=>set('address_line1',e.target.value)} placeholder="Building No., Street, Area" /></Field>
            <Field label="Registered Address (Line 2)"><input value={f.address_line2||''} onChange={e=>set('address_line2',e.target.value)} placeholder="Landmark (optional)" /></Field>
            <Field label="Head Office Address"><input value={f.head_office||''} onChange={e=>set('head_office',e.target.value)} placeholder="If different from registered address" /></Field>
            <Field label="Branch Offices"><textarea value={f.branch_offices||''} onChange={e=>set('branch_offices',e.target.value)} placeholder="List branch office locations, one per line" style={{ minHeight: 70 }} /></Field>
            <div className="grid grid-3">
              <Field label="State">
                <select value={f.state_name||''} onChange={e=>set('state_name',e.target.value)}>
                  <option value="">Select state</option>
                  {INDIA_STATES.map(s=><option key={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="District / City"><input value={f.city||''} onChange={e=>set('city',e.target.value)} placeholder="City / District" /></Field>
              <Field label="PIN Code"><input value={f.pincode||''} onChange={e=>set('pincode',e.target.value.replace(/\D/g,'').slice(0,6))} placeholder="6-digit PIN" /></Field>
            </div>
          </>
        ) : (
          <div className="grid grid-2">
            <ReadOnly label="Phone" value={f.phone} />
            <ReadOnly label="Registered Address" value={[f.address_line1,f.address_line2].filter(Boolean).join(', ')} />
            <ReadOnly label="Head Office" value={f.head_office} />
            <ReadOnly label="Branch Offices" value={f.branch_offices} />
            <ReadOnly label="State" value={f.state_name} />
            <ReadOnly label="District" value={f.city} />
            <ReadOnly label="PIN Code" value={f.pincode} />
          </div>
        )}
      </SectionCard>

      {/* ── 3. CONTACT PERSONS ── */}
      <SectionCard title="Contact Persons"
        editing={ed.contacts} onEdit={() => startEdit('contacts')}
        onCancel={() => cancelEdit('contacts')}
        onSave={() => saveSection('contacts', { first_name: f.first_name, last_name: f.last_name, ceo_name: f.ceo_name, spoc_name: f.spoc_name, ops_head: f.ops_head, finance_contact: f.finance_contact, placement_officer: f.placement_officer })}
        busy={busy.contacts} savedMsg={savedMsg.contacts} error={errors.contacts}>
        {ed.contacts ? (
          <div className="grid grid-2">
            <Field label="CEO / Director"><input value={f.ceo_name||''} onChange={e=>set('ceo_name',e.target.value)} placeholder="Full name" /></Field>
            <Field label="SPOC (Single Point of Contact)"><input value={f.spoc_name||''} onChange={e=>set('spoc_name',e.target.value)} placeholder="Full name" /></Field>
            <Field label="Operations Head"><input value={f.ops_head||''} onChange={e=>set('ops_head',e.target.value)} placeholder="Full name" /></Field>
            <Field label="Finance Contact"><input value={f.finance_contact||''} onChange={e=>set('finance_contact',e.target.value)} placeholder="Full name" /></Field>
            <Field label="Placement Officer"><input value={f.placement_officer||''} onChange={e=>set('placement_officer',e.target.value)} placeholder="Full name" /></Field>
          </div>
        ) : (
          <div className="grid grid-2">
            <ReadOnly label="CEO / Director" value={f.ceo_name} />
            <ReadOnly label="SPOC" value={f.spoc_name} />
            <ReadOnly label="Operations Head" value={f.ops_head} />
            <ReadOnly label="Finance Contact" value={f.finance_contact} />
            <ReadOnly label="Placement Officer" value={f.placement_officer} />
          </div>
        )}
      </SectionCard>

      {/* ── 4. BANK DETAILS ── */}
      <SectionCard title="Bank Details"
        editing={ed.bank} onEdit={() => startEdit('bank')}
        onCancel={() => cancelEdit('bank')}
        onSave={() => saveSection('bank', { bank_account_name: f.bank_account_name, bank_ifsc: f.bank_ifsc, bank_account_number: f.bank_account_number })}
        busy={busy.bank} savedMsg={savedMsg.bank} error={errors.bank}>
        {ed.bank ? (
          <div className="grid grid-3">
            <Field label="Account Name"><input value={f.bank_account_name||''} onChange={e=>set('bank_account_name',e.target.value)} placeholder="As per bank records" /></Field>
            <Field label="IFSC Code"><input value={f.bank_ifsc||''} onChange={e=>set('bank_ifsc',e.target.value.toUpperCase())} placeholder="e.g. SBIN0001234" maxLength={11} /></Field>
            <Field label="Account Number"><input value={f.bank_account_number||''} onChange={e=>set('bank_account_number',e.target.value.replace(/\D/g,''))} placeholder="Account number" /></Field>
          </div>
        ) : (
          <div className="grid grid-3">
            <ReadOnly label="Account Name" value={f.bank_account_name} />
            <ReadOnly label="IFSC Code" value={f.bank_ifsc} />
            <ReadOnly label="Account Number" value={f.bank_account_number ? '••••' + f.bank_account_number.slice(-4) : ''} />
          </div>
        )}
      </SectionCard>

      </div>{/* end 2-col grid */}
    </div>
  );
}

export default function Profile() {
  const { user, refresh } = useAuth();
  const isCandidate = user.role === 'candidate';
  const isTrainingVendor = user.role === 'training_vendor';
  const usesFullProfile = isCandidate || isTrainingVendor;

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

  /* ── helper: parse JSON arrays stored in DB ── */
  function parseArr(v) { try { return JSON.parse(v || '[]'); } catch { return []; } }

  if (isTrainingVendor) return <VendorProfile f={f} set={set} ed={editing} startEdit={startEdit} cancelEdit={cancelEdit} saveSection={saveSection} busy={busy} savedMsg={savedMsg} errors={errors} certRef={certRef} photoRef={photoRef} addCertificates={addCertificates} removeCert={removeCert} readFile={readFile} parseArr={parseArr} />;

  if (!usesFullProfile) {
    return (
      <div className="page" style={{ maxWidth: 640 }}>
        <div className="page-header"><h1>My Profile</h1></div>
        <div className="card shadow">
          <Field label="Full Name"><input value={f.name} onChange={e => set('name', e.target.value)} /></Field>
          <Field label="Email"><input value={f.email} disabled style={{ background: '#F4F6FA', color: 'var(--ink-3)' }} /></Field>
          <Field label="Organization"><input value={f.org_name} onChange={e => set('org_name', e.target.value)} /></Field>
          <Field label="Location"><input value={f.location} onChange={e => set('location', e.target.value)} /></Field>
          <Field label="Phone"><input value={f.phone} onChange={e => set('phone', e.target.value)} /></Field>
          <Field label="Bio"><textarea value={f.bio} onChange={e => set('bio', e.target.value)} /></Field>
          {errors.main && <div style={{ color: '#EF4444', fontSize: 13, marginBottom: 8 }}>{errors.main}</div>}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="btn btn-primary" onClick={() => saveSection('main', { name: f.name, org_name: f.org_name, location: f.location, bio: f.bio, phone: f.phone })} disabled={busy.main}>
              {busy.main ? 'Saving…' : 'Save changes'}
            </button>
            {savedMsg.main && <span style={{ fontSize: 13, color: '#10B981', fontWeight: 600 }}>✓ Saved successfully</span>}
          </div>
        </div>
      </div>
    );
  }

  const ed = editing;

  const displayName = [f.first_name, f.last_name].filter(Boolean).join(' ') || f.org_name || user.name || (isTrainingVendor ? 'Training Vendor' : 'Candidate');

  return (
    <div className="page" style={{ maxWidth: 760 }}>
      <div className="page-header">
        <h1>{displayName}</h1>
        <p>{isTrainingVendor ? 'Keep your organisation details current.' : 'Keep your details current for better job matches.'}</p>
      </div>

      {/* ── PERSONAL / ORGANISATION DETAILS ── */}
      <SectionCard title={isTrainingVendor ? 'Organisation Details' : 'Personal Details'}
        editing={ed.personal} onEdit={() => startEdit('personal')}
        onCancel={() => cancelEdit('personal')}
        onSave={() => saveSection('personal', { first_name: f.first_name, middle_name: f.middle_name, last_name: f.last_name, gender: f.gender, dob: f.dob, category: f.category, org_name: f.org_name })}
        busy={busy.personal} savedMsg={savedMsg.personal} error={errors.personal}>
        {ed.personal ? (
          <>
            {isTrainingVendor && (
              <Field label="Organisation Name" required>
                <input value={f.org_name} onChange={e => set('org_name', e.target.value)} placeholder="e.g. ABC Training Institute Pvt Ltd" />
              </Field>
            )}
            <div className="grid grid-3">
              <Field label={isTrainingVendor ? 'Contact First Name' : 'First Name'}><input value={f.first_name} onChange={e => set('first_name', e.target.value)} placeholder="First name" /></Field>
              <Field label="Middle Name"><input value={f.middle_name} onChange={e => set('middle_name', e.target.value)} placeholder="Middle name" /></Field>
              <Field label={isTrainingVendor ? 'Contact Last Name' : 'Last Name'}><input value={f.last_name} onChange={e => set('last_name', e.target.value)} placeholder="Last name" /></Field>
            </div>
            <div className="grid grid-2">
              <Field label={isTrainingVendor ? 'Organisation Type' : 'Gender'}>
                {isTrainingVendor ? (
                  <select value={f.gender} onChange={e => set('gender', e.target.value)}>
                    <option value="">Select type</option>
                    <option>Private Limited Company</option><option>Public Limited Company</option>
                    <option>Partnership Firm</option><option>Sole Proprietorship</option>
                    <option>LLP (Limited Liability Partnership)</option><option>Society / Trust / NGO</option>
                    <option>Government Institution</option><option>Autonomous Body</option><option>Other</option>
                  </select>
                ) : (
                  <select value={f.gender} onChange={e => set('gender', e.target.value)}>
                    <option value="">Select gender</option>
                    <option>Male</option><option>Female</option><option>Transgender</option><option>Prefer not to say</option>
                  </select>
                )}
              </Field>
              <Field label={isTrainingVendor ? 'Date of Incorporation' : 'Date of Birth'}>
                <DateDMY value={f.dob} onChange={v => set('dob', v)} maxYear={new Date().getFullYear()} minYear={isTrainingVendor ? 1900 : undefined} />
              </Field>
            </div>
            {!isTrainingVendor && (
              <Field label="Category">
                <select value={f.category} onChange={e => set('category', e.target.value)}>
                  <option value="">Select category</option>
                  <option>General</option><option>OBC</option><option>SC</option><option>ST</option><option>EWS</option>
                </select>
              </Field>
            )}
          </>
        ) : (
          <div className="grid grid-2">
            {isTrainingVendor && <ReadOnly label="Organisation Name" value={f.org_name} />}
            <ReadOnly label={isTrainingVendor ? 'Contact Person' : 'Name'} value={[f.first_name, f.middle_name, f.last_name].filter(Boolean).join(' ')} />
            <ReadOnly label={isTrainingVendor ? 'Organisation Type' : 'Gender'} value={f.gender} />
            <ReadOnly label={isTrainingVendor ? 'Date of Incorporation' : 'Date of Birth'} value={f.dob} />
            {!isTrainingVendor && <ReadOnly label="Category" value={f.category} />}
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

      {/* ── EMPLOYMENT STATUS (candidate only) ── */}
      {!isTrainingVendor && <SectionCard title="Employment Status"
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
      </SectionCard>}

      {/* ── SKILLS ── */}
      <SectionCard title={isTrainingVendor ? 'Training Areas & Skills' : 'Skills'}
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
