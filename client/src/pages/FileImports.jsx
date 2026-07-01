import { useState, useRef, useCallback } from 'react';
import { api } from '../api.js';

/* ── Entity definitions ─────────────────────────────────────────── */
const ENTITIES = [
  {
    key: 'candidate', label: 'Candidates', icon: '👤', color: '#1E5FBF',
    apiRole: 'candidate', apiType: 'users',
    fields: [
      { key: 'first_name',        label: 'First Name',         required: true },
      { key: 'last_name',         label: 'Last Name',          required: true },
      { key: 'email',             label: 'Email',              required: true, type: 'email' },
      { key: 'phone',             label: 'Phone',              required: false },
      { key: 'gender',            label: 'Gender',             required: false, enum: ['Male','Female','Other',''] },
      { key: 'dob',               label: 'DOB (DD-MMM-YYYY)',  required: false },
      { key: 'city',              label: 'City',               required: false },
      { key: 'state_name',        label: 'State',              required: false },
      { key: 'qualification',     label: 'Qualification',      required: false },
      { key: 'employment_status', label: 'Employment Status',  required: false },
      { key: 'preferred_sector',  label: 'Preferred Sector',   required: false },
      { key: 'skills',            label: 'Skills (;-separated)',required: false },
    ],
  },
  {
    key: 'training_vendor', label: 'Training Vendors', icon: '🏫', color: '#0A7B6C',
    apiRole: 'training_vendor', apiType: 'users',
    fields: [
      { key: 'name',                label: 'Organisation Name',  required: true },
      { key: 'email',               label: 'Email',              required: true, type: 'email' },
      { key: 'location',            label: 'Location',           required: false },
      { key: 'phone',               label: 'Phone',              required: false },
      { key: 'registration_number', label: 'Reg. Number',        required: false },
      { key: 'pan',                 label: 'PAN',                required: false },
      { key: 'gstin',               label: 'GSTIN',              required: false },
      { key: 'year_established',    label: 'Year Established',   required: false },
      { key: 'ceo_name',            label: 'CEO Name',           required: false },
      { key: 'spoc_name',           label: 'SPOC Name',          required: false },
    ],
  },
  {
    key: 'employer', label: 'Employers', icon: '🏢', color: '#0891B2',
    apiRole: 'employer', apiType: 'users',
    fields: [
      { key: 'name',     label: 'Contact Name',   required: true },
      { key: 'email',    label: 'Email',          required: true, type: 'email' },
      { key: 'org_name', label: 'Company Name',   required: true },
      { key: 'location', label: 'Location',       required: false },
      { key: 'phone',    label: 'Phone',          required: false },
      { key: 'bio',      label: 'About Company',  required: false },
    ],
  },
  {
    key: 'trainer', label: 'Trainers', icon: '👨‍🏫', color: '#7C3AED',
    apiRole: 'trainer', apiType: 'users',
    fields: [
      { key: 'name',     label: 'Name',               required: true },
      { key: 'email',    label: 'Email',              required: true, type: 'email' },
      { key: 'org_name', label: 'Organisation',        required: false },
      { key: 'location', label: 'Location',           required: false },
      { key: 'phone',    label: 'Phone',              required: false },
      { key: 'bio',      label: 'Bio',                required: false },
      { key: 'skills',   label: 'Skills (;-separated)',required: false },
    ],
  },
  {
    key: 'placement_agency', label: 'Placement Agencies', icon: '💼', color: '#C0392B',
    apiRole: 'placement_agency', apiType: 'users',
    fields: [
      { key: 'name',     label: 'Contact Name',  required: true },
      { key: 'email',    label: 'Email',         required: true, type: 'email' },
      { key: 'org_name', label: 'Agency Name',   required: true },
      { key: 'location', label: 'Location',      required: false },
      { key: 'phone',    label: 'Phone',         required: false },
    ],
  },
  {
    key: 'csr_org', label: 'CSR Organizations', icon: '🤝', color: '#D97706',
    apiRole: 'csr_org', apiType: 'users',
    fields: [
      { key: 'name',     label: 'Contact Name',  required: true },
      { key: 'email',    label: 'Email',         required: true, type: 'email' },
      { key: 'org_name', label: 'Organisation',  required: true },
      { key: 'location', label: 'Location',      required: false },
      { key: 'phone',    label: 'Phone',         required: false },
    ],
  },
  {
    key: 'jobs', label: 'Job Postings', icon: '📋', color: '#374151',
    apiType: 'jobs',
    fields: [
      { key: 'title',          label: 'Job Title',              required: true },
      { key: 'employer_email', label: 'Employer Email',         required: true, type: 'email' },
      { key: 'description',    label: 'Description',            required: false },
      { key: 'location',       label: 'Location',               required: false },
      { key: 'job_type',       label: 'Job Type',               required: false, enum: ['Full-time','Part-time','Contract','Internship','Freelance',''] },
      { key: 'salary_min',     label: 'Salary Min (₹)',         required: false, type: 'number' },
      { key: 'salary_max',     label: 'Salary Max (₹)',         required: false, type: 'number' },
      { key: 'required_skills',label: 'Skills (;-separated)',   required: false },
    ],
  },
  {
    key: 'courses', label: 'Course Catalog', icon: '🎓', color: '#065F46',
    apiType: 'courses',
    fields: [
      { key: 'title',          label: 'Course Title',           required: true },
      { key: 'provider',       label: 'Provider',               required: true },
      { key: 'level',          label: 'Level',                  required: false, enum: ['Beginner','Intermediate','Advanced',''] },
      { key: 'duration_weeks', label: 'Duration (weeks)',        required: false, type: 'number' },
      { key: 'rating',         label: 'Rating (0-5)',           required: false, type: 'number' },
      { key: 'skill_tags',     label: 'Skill Tags (;-separated)',required: false },
      { key: 'trainer_email',  label: 'Trainer Email',          required: false, type: 'email' },
    ],
  },
];

/* ── CSV helpers ────────────────────────────────────────────────── */
function buildTemplate(entity) {
  const header = entity.fields.map(f => f.key).join(',');
  const sample = entity.fields.map(f => {
    if (f.type === 'email') return 'example@email.com';
    if (f.type === 'number') return '0';
    if (f.enum) return f.enum.find(e => e) || '';
    return '';
  }).join(',');
  return `${header}\n${sample}`;
}

function downloadCSV(filename, content) {
  const blob = new Blob([content], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function parseCSV(text) {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(l => l.trim());
  if (lines.length < 2) return { headers: [], rows: [] };
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const rows = lines.slice(1).map((line, idx) => {
    const vals = [];
    let cur = '', inQ = false;
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ; }
      else if (ch === ',' && !inQ) { vals.push(cur.trim()); cur = ''; }
      else cur += ch;
    }
    vals.push(cur.trim());
    const obj = {};
    headers.forEach((h, i) => { obj[h] = (vals[i] || '').replace(/^"|"$/g, '').trim(); });
    obj.__row = idx + 2;
    return obj;
  });
  return { headers, rows };
}

function validateRow(row, entity) {
  const errors = [];
  for (const f of entity.fields) {
    const v = row[f.key] || '';
    if (f.required && !v) errors.push(`${f.label} is required`);
    if (v && f.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) errors.push(`${f.label} is not a valid email`);
    if (v && f.type === 'number' && isNaN(Number(v))) errors.push(`${f.label} must be a number`);
    if (v && f.enum && f.enum.length && !f.enum.includes(v)) errors.push(`${f.label} must be one of: ${f.enum.filter(Boolean).join(', ')}`);
  }
  return errors;
}

/* ── Sub-components ─────────────────────────────────────────────── */
function StepDot({ n, label, active, done }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: 72 }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800,
        background: done ? '#10B981' : active ? '#1E5FBF' : '#E5E7EB',
        color: done || active ? '#fff' : '#9CA3AF' }}>
        {done ? '✓' : n}
      </div>
      <span style={{ fontSize: 10, fontWeight: 600, color: active ? '#1E5FBF' : done ? '#10B981' : '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.3, whiteSpace: 'nowrap' }}>{label}</span>
    </div>
  );
}

function Steps({ step }) {
  const steps = ['Select', 'Template', 'Upload', 'Review', 'Done'];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 28 }}>
      {steps.map((s, i) => (
        <div key={s} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 'none' }}>
          <StepDot n={i + 1} label={s} active={step === i} done={step > i} />
          {i < steps.length - 1 && <div style={{ flex: 1, height: 2, background: step > i ? '#10B981' : '#E5E7EB', margin: '0 4px', marginBottom: 16 }} />}
        </div>
      ))}
    </div>
  );
}

/* ── Main component ─────────────────────────────────────────────── */
export default function FileImports() {
  const [entity, setEntity] = useState(null);   // step 0 → 1
  const [step, setStep] = useState(0);           // 0=select 1=template 2=upload 3=review 4=done
  const [rows, setRows] = useState([]);          // parsed + validated rows
  const [headers, setHeaders] = useState([]);
  const [result, setResult] = useState(null);    // import result
  const [busy, setBusy] = useState(false);
  const fileRef = useRef();
  const dragRef = useRef();

  function selectEntity(e) { setEntity(e); setStep(1); setRows([]); setResult(null); }
  function reset() { setEntity(null); setStep(0); setRows([]); setResult(null); }

  function downloadTemplate() {
    downloadCSV(`template_${entity.key}.csv`, buildTemplate(entity));
  }

  function handleFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const { headers: h, rows: r } = parseCSV(ev.target.result);
      const validated = r.map(row => ({ ...row, __errors: validateRow(row, entity) }));
      setHeaders(h);
      setRows(validated);
      setStep(3);
    };
    reader.readAsText(file);
  }

  const onDrop = useCallback(e => {
    e.preventDefault();
    dragRef.current?.classList.remove('drag-over');
    const file = e.dataTransfer?.files?.[0];
    if (file?.name.endsWith('.csv')) handleFile(file);
  }, [entity]);

  function editCell(rowIdx, key, val) {
    setRows(prev => {
      const next = [...prev];
      next[rowIdx] = { ...next[rowIdx], [key]: val };
      next[rowIdx].__errors = validateRow(next[rowIdx], entity);
      return next;
    });
  }

  async function doImport() {
    const valid = rows.filter(r => r.__errors.length === 0);
    if (!valid.length) return;
    setBusy(true);
    try {
      const clean = valid.map(({ __errors, __row, ...rest }) => rest);
      let res;
      if (entity.apiType === 'users') res = await api.importUsers(entity.apiRole, clean);
      else if (entity.apiType === 'jobs') res = await api.importJobs(clean);
      else res = await api.importCourses(clean);
      setResult(res);
      setStep(4);
    } catch (e) { alert('Import failed: ' + e.message); }
    finally { setBusy(false); }
  }

  const valid   = rows.filter(r => r.__errors.length === 0);
  const invalid = rows.filter(r => r.__errors.length > 0);

  /* ── Render ── */
  return (
    <div className="page" style={{ maxWidth: 1100 }}>
      <div className="page-header" style={{ marginBottom: 24 }}>
        <h1>File Imports</h1>
        <p>Bulk import data using CSV files. Download the template, fill it in, upload and review before importing.</p>
      </div>
      <Steps step={step} />

      {/* STEP 0 — Select entity */}
      {step === 0 && (
        <div>
          <p style={{ fontSize: 13, color: '#7886A6', marginBottom: 16 }}>Choose the type of data you want to import:</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {ENTITIES.map(e => (
              <div key={e.key} onClick={() => selectEntity(e)}
                className="card shadow"
                style={{ cursor: 'pointer', textAlign: 'center', padding: '18px 12px', transition: 'box-shadow .15s, border-color .15s', border: '1.5px solid #DDE3EE' }}
                onMouseEnter={ev => { ev.currentTarget.style.borderColor = e.color; ev.currentTarget.style.boxShadow = `0 4px 20px rgba(0,0,0,.12)`; }}
                onMouseLeave={ev => { ev.currentTarget.style.borderColor = '#DDE3EE'; ev.currentTarget.style.boxShadow = ''; }}>
                <div style={{ fontSize: 26, marginBottom: 8 }}>{e.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#0B1E3D' }}>{e.label}</div>
                <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>{e.fields.length} fields</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STEP 1 — Download template */}
      {step === 1 && entity && (
        <div className="card shadow" style={{ padding: 28, textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>{entity.icon}</div>
          <div style={{ fontWeight: 800, fontSize: 16, color: '#0B1E3D', marginBottom: 6 }}>{entity.label} — Download Template</div>
          <p style={{ color: '#7886A6', fontSize: 13, marginBottom: 20, maxWidth: 460, margin: '0 auto 20px' }}>
            Download the CSV template below. Fill in your data (row 2 is an example — replace it). Required fields are marked with <strong>*</strong>.
          </p>
          {/* Field reference */}
          <div style={{ background: '#F8FAFC', borderRadius: 10, padding: '12px 16px', marginBottom: 24, textAlign: 'left', display: 'inline-block', minWidth: 320 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#445074', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Fields in template</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {entity.fields.map(f => (
                <span key={f.key} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 12, fontWeight: 600,
                  background: f.required ? '#EFF6FF' : '#F1F5F9',
                  color: f.required ? '#1E5FBF' : '#7886A6',
                  border: `1px solid ${f.required ? '#BFDBFE' : '#E5E7EB'}` }}>
                  {f.required ? '* ' : ''}{f.label}
                </span>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button className="btn btn-outline btn-sm" onClick={reset}>← Back</button>
            <button className="btn btn-primary" onClick={() => { downloadTemplate(); setStep(2); }} style={{ padding: '9px 20px' }}>
              ↓ Download Template &amp; Continue
            </button>
          </div>
        </div>
      )}

      {/* STEP 2 — Upload CSV */}
      {step === 2 && entity && (
        <div className="card shadow" style={{ padding: 28 }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: '#0B1E3D', marginBottom: 4 }}>Upload filled CSV — {entity.label}</div>
          <p style={{ color: '#7886A6', fontSize: 13, marginBottom: 20 }}>Upload the CSV you filled in. We'll validate each row before importing.</p>

          <div ref={dragRef}
            onDragOver={e => { e.preventDefault(); dragRef.current.style.borderColor = entity.color; }}
            onDragLeave={() => { dragRef.current.style.borderColor = '#DDE3EE'; }}
            onDrop={onDrop}
            onClick={() => fileRef.current.click()}
            style={{ border: '2px dashed #DDE3EE', borderRadius: 12, padding: '40px 24px', textAlign: 'center', cursor: 'pointer', transition: 'border-color .15s', background: '#FAFBFD' }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>📂</div>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#0B1E3D', marginBottom: 4 }}>Drag & drop CSV file here</div>
            <div style={{ fontSize: 12, color: '#9CA3AF' }}>or click to browse — .csv files only</div>
            <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button className="btn btn-outline btn-sm" onClick={() => setStep(1)}>← Back</button>
            <button className="btn btn-outline btn-sm" onClick={downloadTemplate}>↓ Re-download template</button>
          </div>
        </div>
      )}

      {/* STEP 3 — Review & fix */}
      {step === 3 && entity && rows.length > 0 && (
        <div>
          {/* Summary bar */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <span style={{ background: '#ECFDF5', color: '#065F46', fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 20 }}>✓ {valid.length} valid</span>
              <span style={{ background: invalid.length ? '#FEF2F2' : '#F1F5F9', color: invalid.length ? '#991B1B' : '#9CA3AF', fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 20 }}>✗ {invalid.length} errors</span>
              <span style={{ background: '#EFF6FF', color: '#1E40AF', fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 20 }}>{rows.length} total rows</span>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              <button className="btn btn-outline btn-sm" onClick={() => setStep(2)}>← Re-upload</button>
              <button className="btn btn-primary btn-sm" onClick={doImport} disabled={busy || valid.length === 0}
                style={{ background: valid.length ? '#1E5FBF' : '#9CA3AF' }}>
                {busy ? 'Importing…' : `↑ Import ${valid.length} valid record${valid.length !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>

          {invalid.length > 0 && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#991B1B' }}>
              <strong>Fix errors below</strong> — click any red cell to edit inline. Valid rows will be imported even if some rows have errors.
            </div>
          )}

          {/* Data table */}
          <div className="card shadow" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto', maxHeight: 500, overflowY: 'auto' }}>
              <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 12 }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
                  <tr style={{ background: '#0F2545' }}>
                    <th style={{ padding: '8px 10px', color: 'rgba(255,255,255,.5)', fontSize: 10, fontWeight: 700, textAlign: 'center', minWidth: 36 }}>#</th>
                    <th style={{ padding: '8px 10px', color: 'rgba(255,255,255,.5)', fontSize: 10, fontWeight: 700, textAlign: 'left', minWidth: 80 }}>Status</th>
                    {entity.fields.map(f => (
                      <th key={f.key} style={{ padding: '8px 10px', color: 'rgba(255,255,255,.7)', fontSize: 10, fontWeight: 700, textAlign: 'left', whiteSpace: 'nowrap' }}>
                        {f.required ? '* ' : ''}{f.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, ri) => {
                    const hasErr = row.__errors.length > 0;
                    return (
                      <tr key={ri} style={{ background: hasErr ? '#FFF5F5' : ri % 2 === 0 ? '#fff' : '#FAFBFD', borderBottom: '1px solid #EEF2F8' }}>
                        <td style={{ padding: '6px 10px', textAlign: 'center', color: '#9CA3AF', fontWeight: 600 }}>{row.__row}</td>
                        <td style={{ padding: '6px 10px' }}>
                          {hasErr
                            ? <div title={row.__errors.join('\n')} style={{ cursor: 'help' }}>
                                <span style={{ background: '#FEE2E2', color: '#B91C1C', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 10 }}>✗ {row.__errors.length} error{row.__errors.length > 1 ? 's' : ''}</span>
                              </div>
                            : <span style={{ background: '#D1FAE5', color: '#065F46', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 10 }}>✓ OK</span>
                          }
                        </td>
                        {entity.fields.map(f => {
                          const fieldErr = row.__errors.some(e => e.startsWith(f.label));
                          return (
                            <td key={f.key} style={{ padding: '4px 6px', background: fieldErr ? '#FEE2E2' : 'transparent', minWidth: 100 }}>
                              <input
                                value={row[f.key] || ''}
                                onChange={e => editCell(ri, f.key, e.target.value)}
                                style={{
                                  width: '100%', border: fieldErr ? '1.5px solid #F87171' : '1px solid transparent',
                                  borderRadius: 6, padding: '3px 6px', fontSize: 12, background: 'transparent',
                                  color: '#0B1E3D', outline: 'none', fontFamily: 'inherit',
                                }}
                                onFocus={e => { e.target.style.background = '#fff'; e.target.style.borderColor = fieldErr ? '#F87171' : '#6B9EF0'; }}
                                onBlur={e => { e.target.style.background = 'transparent'; if (!fieldErr) e.target.style.borderColor = 'transparent'; }}
                                title={fieldErr ? row.__errors.find(e => e.startsWith(f.label)) : ''}
                              />
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Error summary */}
          {invalid.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#991B1B', marginBottom: 8 }}>Error details</div>
              {invalid.map((row, i) => (
                <div key={i} style={{ background: '#FEF2F2', borderLeft: '3px solid #F87171', borderRadius: '0 8px 8px 0', padding: '7px 12px', marginBottom: 6, fontSize: 12 }}>
                  <span style={{ fontWeight: 700, color: '#7F1D1D' }}>Row {row.__row}:</span>{' '}
                  <span style={{ color: '#991B1B' }}>{row.__errors.join(' · ')}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* STEP 4 — Done */}
      {step === 4 && result && (
        <div className="card shadow" style={{ padding: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
          <div style={{ fontWeight: 800, fontSize: 18, color: '#0B1E3D', marginBottom: 8 }}>Import Complete — {entity.label}</div>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 24 }}>
            <div style={{ background: '#ECFDF5', borderRadius: 12, padding: '16px 24px' }}>
              <div style={{ fontWeight: 800, fontSize: 28, color: '#065F46' }}>{result.imported}</div>
              <div style={{ fontSize: 12, color: '#6EE7B7', fontWeight: 600 }}>Imported</div>
            </div>
            {result.skipped > 0 && (
              <div style={{ background: '#FFF7ED', borderRadius: 12, padding: '16px 24px' }}>
                <div style={{ fontWeight: 800, fontSize: 28, color: '#92400E' }}>{result.skipped}</div>
                <div style={{ fontSize: 12, color: '#FCD34D', fontWeight: 600 }}>Skipped (duplicate)</div>
              </div>
            )}
            {result.errors > 0 && (
              <div style={{ background: '#FEF2F2', borderRadius: 12, padding: '16px 24px' }}>
                <div style={{ fontWeight: 800, fontSize: 28, color: '#991B1B' }}>{result.errors}</div>
                <div style={{ fontSize: 12, color: '#FCA5A5', fontWeight: 600 }}>Errors</div>
              </div>
            )}
          </div>
          {result.results?.filter(r => r.status !== 'imported').length > 0 && (
            <div style={{ textAlign: 'left', background: '#FEF2F2', borderRadius: 10, padding: '12px 16px', marginBottom: 20, maxHeight: 160, overflowY: 'auto' }}>
              {result.results.filter(r => r.status !== 'imported').map((r, i) => (
                <div key={i} style={{ fontSize: 12, color: '#991B1B', marginBottom: 4 }}>
                  <strong>{r.email || r.title}</strong>: {r.reason}
                </div>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button className="btn btn-outline btn-sm" onClick={() => { setStep(3); setResult(null); }}>← Back to review</button>
            <button className="btn btn-primary" onClick={reset}>Import another file</button>
          </div>
        </div>
      )}
    </div>
  );
}
