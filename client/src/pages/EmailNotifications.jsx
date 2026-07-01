import { useState } from 'react';

/* ── Seed data ──────────────────────────────────────────────────── */
const SEED_SMTP = {
  host: 'smtp.gmail.com', port: '587', encryption: 'TLS',
  username: 'noreply@skillsnjobs.in', password: '', fromName: 'SkillsNJobs', fromEmail: 'noreply@skillsnjobs.in',
};

const SEED_OTP = {
  provider: 'Email', otpLength: '6', expiryMinutes: '10', maxAttempts: '3',
};

const SEED_TEMPLATES = [
  { id: 1, key: 'welcome',        name: 'Welcome Email',          trigger: 'On Registration',       active: true,  subject: 'Welcome to SkillsNJobs!',                  body: 'Hi {{name}},\n\nWelcome to SkillsNJobs! Your account has been created.\n\nRole: {{role}}\nEmail: {{email}}\nPassword: {{password}}\n\nPlease login and complete your profile.\n\nRegards,\nSkillsNJobs Team' },
  { id: 2, key: 'otp',            name: 'OTP Verification',        trigger: 'On OTP Request',        active: true,  subject: 'Your OTP for SkillsNJobs',                 body: 'Hi {{name}},\n\nYour OTP is: {{otp}}\n\nThis OTP expires in {{expiry}} minutes.\n\nDo not share this with anyone.\n\nRegards,\nSkillsNJobs Team' },
  { id: 3, key: 'job_applied',    name: 'Job Application Received',trigger: 'On Application Submit', active: true,  subject: 'Application received – {{job_title}}',      body: 'Hi {{candidate_name}},\n\nYour application for {{job_title}} at {{company}} has been received.\n\nWe will notify you of any updates.\n\nRegards,\nSkillsNJobs Team' },
  { id: 4, key: 'shortlisted',    name: 'Shortlisted Notification',trigger: 'On Status: Shortlisted',active: true,  subject: 'You have been shortlisted – {{job_title}}', body: 'Hi {{candidate_name}},\n\nCongratulations! You have been shortlisted for {{job_title}} at {{company}}.\n\nThe employer will be in touch soon.\n\nRegards,\nSkillsNJobs Team' },
  { id: 5, key: 'hired',          name: 'Hired Notification',      trigger: 'On Status: Hired',      active: true,  subject: '🎉 Offer Letter – {{job_title}}',           body: 'Hi {{candidate_name}},\n\nCongratulations! You have been selected for {{job_title}} at {{company}}.\n\nPlease contact the employer to discuss next steps.\n\nRegards,\nSkillsNJobs Team' },
  { id: 6, key: 'rejected',       name: 'Rejection Notification',  trigger: 'On Status: Rejected',   active: false, subject: 'Application Update – {{job_title}}',        body: 'Hi {{candidate_name}},\n\nThank you for applying to {{job_title}} at {{company}}. We regret to inform you that your application was not selected.\n\nKeep applying – new opportunities are added daily!\n\nRegards,\nSkillsNJobs Team' },
  { id: 7, key: 'course_enroll',  name: 'Course Enrolment',        trigger: 'On Course Enrol',       active: true,  subject: 'Enrolled in {{course_title}}',              body: 'Hi {{name}},\n\nYou have successfully enrolled in {{course_title}} by {{provider}}.\n\nDuration: {{duration}} weeks\n\nBest of luck!\n\nSkillsNJobs Team' },
  { id: 8, key: 'import_done',    name: 'Bulk Import Summary',     trigger: 'On File Import',        active: true,  subject: 'Import Complete – {{entity}}',              body: 'Hi {{admin_name}},\n\nYour bulk import for {{entity}} is complete.\n\nImported: {{imported}}\nSkipped: {{skipped}}\nErrors: {{errors}}\n\nSkillsNJobs Team' },
];

const TABS = ['SMTP', 'OTP Settings', 'Templates', 'Test Email'];

function Section({ title, children }) {
  return (
    <div className="card shadow" style={{ padding: 24, marginBottom: 20 }}>
      <div style={{ fontWeight: 800, fontSize: 14, color: '#0B1E3D', marginBottom: 18, paddingBottom: 12, borderBottom: '1px solid #EEF2F8' }}>{title}</div>
      {children}
    </div>
  );
}

function Row({ children }) {
  return <div style={{ display: 'flex', gap: 14, marginBottom: 14, flexWrap: 'wrap' }}>{children}</div>;
}

function Field({ label, children, flex = 1 }) {
  return (
    <div style={{ flex, minWidth: 160 }}>
      <label style={{ fontSize: 12, fontWeight: 700, color: '#445074', display: 'block', marginBottom: 5 }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #DDE3EE', fontSize: 13, boxSizing: 'border-box', background: '#FAFBFD' };
const selectStyle = { ...inputStyle };

export default function EmailNotifications() {
  const [tab, setTab]         = useState('SMTP');
  const [smtp, setSmtp]       = useState(SEED_SMTP);
  const [otp, setOtp]         = useState(SEED_OTP);
  const [templates, setTemplates] = useState(SEED_TEMPLATES);
  const [editing, setEditing] = useState(null);  // template being edited
  const [saved, setSaved]     = useState('');
  const [testEmail, setTestEmail] = useState({ to: '', template: 'welcome', status: '' });
  const [showPass, setShowPass] = useState(false);

  function saveSection(label) { setSaved(label); setTimeout(() => setSaved(''), 2500); }

  function updateTemplate(id, key, val) {
    setTemplates(p => p.map(t => t.id === id ? { ...t, [key]: val } : t));
    if (editing?.id === id) setEditing(e => ({ ...e, [key]: val }));
  }

  function sendTest() {
    if (!testEmail.to) return;
    setTestEmail(e => ({ ...e, status: 'sending' }));
    setTimeout(() => setTestEmail(e => ({ ...e, status: 'sent' })), 1500);
    setTimeout(() => setTestEmail(e => ({ ...e, status: '' })), 4000);
  }

  const TAB_STYLE = (k) => ({
    padding: '8px 16px', fontSize: 13, fontWeight: 700, borderRadius: 8, border: 'none', cursor: 'pointer',
    background: tab === k ? '#1E5FBF' : 'transparent', color: tab === k ? '#fff' : '#7886A6', transition: 'all .15s',
  });

  const vars = {
    welcome: ['name','role','email','password'],
    otp: ['name','otp','expiry'],
    job_applied: ['candidate_name','job_title','company'],
    shortlisted: ['candidate_name','job_title','company'],
    hired: ['candidate_name','job_title','company'],
    rejected: ['candidate_name','job_title','company'],
    course_enroll: ['name','course_title','provider','duration'],
    import_done: ['admin_name','entity','imported','skipped','errors'],
  };

  return (
    <div className="page" style={{ maxWidth: 960 }}>
      <div className="page-header">
        <h1>Email &amp; Notifications</h1>
        <p>Configure SMTP, OTP delivery, and manage email templates for all platform events.</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 24, background: '#F1F5F9', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        {TABS.map(t => <button key={t} style={TAB_STYLE(t)} onClick={() => setTab(t)}>{t}</button>)}
      </div>

      {/* ── SMTP ── */}
      {tab === 'SMTP' && (
        <>
          <Section title="SMTP Server Configuration">
            <Row>
              <Field label="SMTP Host" flex={2}><input value={smtp.host} onChange={e => setSmtp(s => ({ ...s, host: e.target.value }))} style={inputStyle} placeholder="smtp.gmail.com" /></Field>
              <Field label="Port"><input value={smtp.port} onChange={e => setSmtp(s => ({ ...s, port: e.target.value }))} style={inputStyle} placeholder="587" /></Field>
              <Field label="Encryption">
                <select value={smtp.encryption} onChange={e => setSmtp(s => ({ ...s, encryption: e.target.value }))} style={selectStyle}>
                  <option>TLS</option><option>SSL</option><option>None</option>
                </select>
              </Field>
            </Row>
            <Row>
              <Field label="Username (Email)"><input value={smtp.username} onChange={e => setSmtp(s => ({ ...s, username: e.target.value }))} style={inputStyle} placeholder="noreply@example.com" /></Field>
              <Field label="Password">
                <div style={{ position: 'relative' }}>
                  <input type={showPass ? 'text' : 'password'} value={smtp.password} onChange={e => setSmtp(s => ({ ...s, password: e.target.value }))} style={{ ...inputStyle, paddingRight: 40 }} placeholder="App password / SMTP key" />
                  <button onClick={() => setShowPass(p => !p)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#9CA3AF' }}>{showPass ? '🙈' : '👁️'}</button>
                </div>
              </Field>
            </Row>
          </Section>
          <Section title="Sender Identity">
            <Row>
              <Field label="From Name"><input value={smtp.fromName} onChange={e => setSmtp(s => ({ ...s, fromName: e.target.value }))} style={inputStyle} placeholder="SkillsNJobs" /></Field>
              <Field label="From Email"><input value={smtp.fromEmail} onChange={e => setSmtp(s => ({ ...s, fromEmail: e.target.value }))} style={inputStyle} placeholder="noreply@skillsnjobs.in" /></Field>
            </Row>
          </Section>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-outline btn-sm" onClick={() => setTab('Test Email')}>Send Test Email</button>
            <button className="btn btn-primary" onClick={() => saveSection('SMTP')} style={{ padding: '9px 22px' }}>
              {saved === 'SMTP' ? '✓ Saved' : 'Save SMTP Settings'}
            </button>
          </div>
        </>
      )}

      {/* ── OTP ── */}
      {tab === 'OTP Settings' && (
        <>
          <Section title="OTP Delivery Configuration">
            <Row>
              <Field label="OTP Delivery Channel">
                <select value={otp.provider} onChange={e => setOtp(o => ({ ...o, provider: e.target.value }))} style={selectStyle}>
                  <option>Email</option><option>SMS</option><option>Both</option>
                </select>
              </Field>
              <Field label="OTP Length">
                <select value={otp.otpLength} onChange={e => setOtp(o => ({ ...o, otpLength: e.target.value }))} style={selectStyle}>
                  <option value="4">4 digits</option><option value="6">6 digits</option><option value="8">8 digits</option>
                </select>
              </Field>
              <Field label="Expiry (minutes)">
                <select value={otp.expiryMinutes} onChange={e => setOtp(o => ({ ...o, expiryMinutes: e.target.value }))} style={selectStyle}>
                  <option value="5">5 min</option><option value="10">10 min</option><option value="15">15 min</option><option value="30">30 min</option>
                </select>
              </Field>
              <Field label="Max Attempts">
                <select value={otp.maxAttempts} onChange={e => setOtp(o => ({ ...o, maxAttempts: e.target.value }))} style={selectStyle}>
                  <option value="3">3</option><option value="5">5</option><option value="10">10</option>
                </select>
              </Field>
            </Row>
          </Section>
          <div style={{ background: '#EFF6FF', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#1E40AF' }}>
            ℹ️ SMS delivery requires a provider (e.g. Twilio, MSG91). Configure API keys in your server .env file: <code style={{ background: '#DBEAFE', padding: '1px 6px', borderRadius: 4 }}>SMS_PROVIDER</code>, <code style={{ background: '#DBEAFE', padding: '1px 6px', borderRadius: 4 }}>SMS_API_KEY</code>.
          </div>
          <button className="btn btn-primary" onClick={() => saveSection('OTP')} style={{ padding: '9px 22px' }}>
            {saved === 'OTP' ? '✓ Saved' : 'Save OTP Settings'}
          </button>
        </>
      )}

      {/* ── TEMPLATES ── */}
      {tab === 'Templates' && (
        <div style={{ display: 'flex', gap: 20 }}>
          {/* List */}
          <div style={{ width: 240, flexShrink: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>Email Templates</div>
            {templates.map(t => (
              <div key={t.id} onClick={() => setEditing(t)}
                style={{ padding: '10px 14px', borderRadius: 9, cursor: 'pointer', marginBottom: 4,
                  background: editing?.id === t.id ? '#EFF6FF' : '#fff',
                  border: editing?.id === t.id ? '1.5px solid #6B9EF0' : '1.5px solid #EEF2F8',
                  transition: 'all .15s' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontWeight: 700, fontSize: 12, color: '#0B1E3D' }}>{t.name}</div>
                  <div onClick={e => { e.stopPropagation(); updateTemplate(t.id, 'active', !t.active); }}
                    style={{ width: 32, height: 18, borderRadius: 9, background: t.active ? '#10B981' : '#D1D5DB', position: 'relative', cursor: 'pointer', transition: 'background .2s' }}>
                    <div style={{ position: 'absolute', top: 2, left: t.active ? 14 : 2, width: 14, height: 14, borderRadius: '50%', background: '#fff', transition: 'left .2s' }} />
                  </div>
                </div>
                <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 3 }}>{t.trigger}</div>
              </div>
            ))}
          </div>

          {/* Editor */}
          {editing ? (
            <div style={{ flex: 1 }}>
              <div className="card shadow" style={{ padding: 20 }}>
                <div style={{ fontWeight: 800, fontSize: 14, color: '#0B1E3D', marginBottom: 14 }}>{editing.name}</div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#445074', display: 'block', marginBottom: 5 }}>Subject Line</label>
                  <input value={editing.subject} onChange={e => updateTemplate(editing.id, 'subject', e.target.value)}
                    style={{ ...inputStyle, width: '100%' }} />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#445074', display: 'block', marginBottom: 5 }}>Email Body</label>
                  <textarea value={editing.body} onChange={e => updateTemplate(editing.id, 'body', e.target.value)} rows={12}
                    style={{ ...inputStyle, width: '100%', resize: 'vertical', fontFamily: 'monospace', fontSize: 12 }} />
                </div>
                {/* Available variables */}
                <div style={{ background: '#F8FAFC', borderRadius: 9, padding: '10px 14px', marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 6 }}>Available variables</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {(vars[editing.key] || []).map(v => (
                      <code key={v} onClick={() => updateTemplate(editing.id, 'body', editing.body + `{{${v}}}`)}
                        style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: '#EFF6FF', color: '#1E5FBF', border: '1px solid #BFDBFE', cursor: 'pointer', fontWeight: 600 }}
                        title="Click to insert">
                        {`{{${v}}}`}
                      </code>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button className="btn btn-outline btn-sm" onClick={() => setEditing(null)}>Discard</button>
                  <button className="btn btn-primary btn-sm" onClick={() => saveSection('template-' + editing.id)}>
                    {saved === 'template-' + editing.id ? '✓ Saved' : 'Save Template'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', fontSize: 13 }}>
              Select a template from the left to edit it
            </div>
          )}
        </div>
      )}

      {/* ── TEST EMAIL ── */}
      {tab === 'Test Email' && (
        <Section title="Send a Test Email">
          <p style={{ fontSize: 13, color: '#7886A6', marginBottom: 18 }}>Send a test email using current SMTP settings to verify your configuration is working correctly.</p>
          <Row>
            <Field label="Send To (email address)" flex={2}>
              <input value={testEmail.to} onChange={e => setTestEmail(t => ({ ...t, to: e.target.value }))}
                placeholder="you@example.com" style={inputStyle} />
            </Field>
            <Field label="Template">
              <select value={testEmail.template} onChange={e => setTestEmail(t => ({ ...t, template: e.target.value }))} style={selectStyle}>
                {templates.map(t => <option key={t.key} value={t.key}>{t.name}</option>)}
              </select>
            </Field>
          </Row>
          <div style={{ background: '#F8FAFC', borderRadius: 10, padding: '14px 16px', marginBottom: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 6 }}>Preview — {templates.find(t => t.key === testEmail.template)?.subject}</div>
            <pre style={{ fontSize: 12, color: '#445074', lineHeight: 1.7, whiteSpace: 'pre-wrap', margin: 0, fontFamily: 'inherit' }}>
              {templates.find(t => t.key === testEmail.template)?.body}
            </pre>
          </div>
          <button className="btn btn-primary" onClick={sendTest} disabled={testEmail.status === 'sending' || !testEmail.to}
            style={{ padding: '9px 22px', minWidth: 150 }}>
            {testEmail.status === 'sending' ? '⏳ Sending…' : testEmail.status === 'sent' ? '✓ Email Sent!' : '↗ Send Test Email'}
          </button>
          {testEmail.status === 'sent' && (
            <div style={{ marginTop: 12, fontSize: 13, color: '#10B981', fontWeight: 700 }}>
              ✓ Test email sent to {testEmail.to} — check your inbox (and spam folder).
            </div>
          )}
          <div style={{ marginTop: 20, background: '#FFF7ED', borderRadius: 10, padding: '12px 16px', fontSize: 12, color: '#92400E' }}>
            ⚠️ Make sure SMTP credentials are saved before sending a test email. Gmail requires an <strong>App Password</strong> (not your account password) when 2FA is enabled.
          </div>
        </Section>
      )}
    </div>
  );
}
