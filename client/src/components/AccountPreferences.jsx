import { useState, useEffect } from 'react';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

const NOTIF_DEFAULTS = {
  candidate: [
    ['New job matches', 'Alert when new jobs match your profile', true],
    ['Course enrollment updates', 'Notify on batch start, completion, certificates', true],
    ['Application status changes', 'Updates when employers act on your applications', true],
    ['Scheme & benefit alerts', 'PMKVY, DDU-GKY and other scheme notifications', true],
    ['Assessment reminders', 'Remind about upcoming assessments', true],
    ['Weekly career digest', 'Summary of new jobs and courses every Monday', false],
  ],
  employer: [
    ['New applications received', 'Alert when candidates apply to your jobs', true],
    ['Shortlist & interview reminders', 'Remind about scheduled interviews', true],
    ['Offer status updates', 'Notify when candidate accepts or declines', true],
    ['Scheme & incentive alerts', 'Updates on PMKVY, NAPS incentive credits', true],
    ['Compliance reminders', 'PF/ESI filing deadlines and renewal alerts', true],
    ['Weekly hiring digest', 'Summary report every Monday morning', false],
  ],
  trainer: [
    ['New batch assignments', 'Alert when assigned to a new batch', true],
    ['Learner progress updates', 'Notify on assessments and completions', true],
    ['Session reminders', 'Remind about upcoming training sessions', true],
    ['Compliance & document alerts', 'Renewal and certification deadlines', true],
    ['Grievance updates', 'Notify when a learner raises a grievance', false],
    ['Weekly batch digest', 'Summary of batch progress every Monday', false],
  ],
  training_vendor: [
    ['New batch enrolments', 'Alert when candidates enrol in your batches', true],
    ['Assessment schedule reminders', 'Remind about upcoming assessments', true],
    ['Certificate generation alerts', 'Notify when certificates are ready', true],
    ['Compliance & renewal reminders', 'NSDC affiliation and document renewal alerts', true],
    ['Grievance updates', 'Notify when a grievance is raised or resolved', true],
    ['Weekly MIS digest', 'Summary report every Monday morning', false],
  ],
  placement_agency: [
    ['New job matches for candidates', 'Alert when new jobs match your candidates', true],
    ['Placement milestone updates', 'Notify on offer acceptance and joining', true],
    ['Employer partnership alerts', 'Updates from partner employers', true],
    ['Compliance reminders', 'Document and renewal deadline alerts', true],
    ['Grievance updates', 'Notify when a grievance is raised', false],
    ['Weekly placement digest', 'Summary report every Monday morning', false],
  ],
  csr_org: [
    ['Project funding alerts', 'Notify when disbursements are processed', true],
    ['Beneficiary milestone updates', 'Certification and placement milestone alerts', true],
    ['Compliance & CSR reporting', 'Annual CSR filing and document reminders', true],
    ['Partner TP updates', 'New training partner registrations and status', true],
    ['Grievance escalations', 'Alert on unresolved high-priority grievances', false],
    ['Weekly impact digest', 'Weekly summary of CSR project impact', false],
  ],
  state_government: [
    ['Scheme disbursement alerts', 'Notify when funds are released or pending', true],
    ['Grievance escalation alerts', 'Alert on high-priority unresolved grievances', true],
    ['Training partner updates', 'New TP registrations and compliance alerts', true],
    ['MIS report availability', 'Notify when monthly MIS reports are ready', true],
    ['Candidate milestone alerts', 'Certification and placement milestone updates', false],
    ['Weekly summary digest', 'District-wise performance summary every Monday', false],
  ],
};

const ACCOUNT_FIELDS = {
  candidate:        [['Full Name','name'],['Email','email'],['Phone','phone'],['Location','location']],
  employer:         [['Company Name','org_name'],['Login Email','email'],['Phone','phone'],['Location','location']],
  trainer:          [['Full Name','name'],['Login Email','email'],['Phone','phone'],['Location','location']],
  training_vendor:  [['Organisation Name','org_name'],['Login Email','email'],['Phone','phone'],['Location','location']],
  placement_agency: [['Organisation Name','org_name'],['Login Email','email'],['Phone','phone'],['Location','location']],
  csr_org:          [['Organisation Name','org_name'],['Login Email','email'],['Phone','phone'],['Location','location']],
  state_government: [['Name','name'],['Email','email'],['Organisation','org_name'],['Location','location']],
};

export default function AccountPreferences({ onLogout, cardStyle = {} }) {
  const { user, setUser } = useAuth();
  const role = user?.role || 'candidate';
  const fields = ACCOUNT_FIELDS[role] || ACCOUNT_FIELDS.candidate;
  const notifItems = NOTIF_DEFAULTS[role] || NOTIF_DEFAULTS.candidate;

  // Account info state
  const [form, setForm] = useState(() => {
    const f = {};
    fields.forEach(([, key]) => { f[key] = user?.[key] || ''; });
    return f;
  });
  const [saveMsg, setSaveMsg] = useState('');
  const [saving, setSaving] = useState(false);
  const [phoneError, setPhoneError] = useState('');

  function validatePhone(val) {
    const digits = (val || '').replace(/\D/g, '');
    if (!digits) return '';
    if (digits.length !== 10) return 'Must be exactly 10 digits';
    if (!/^[6-9]/.test(digits)) return 'Must start with 6, 7, 8, or 9';
    return '';
  }

  // Password state
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [pwMsg, setPwMsg] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwBusy, setPwBusy] = useState(false);

  // Notification preferences — load from server (falls back to role defaults)
  const [notifState, setNotifState] = useState(() =>
    Object.fromEntries(notifItems.map(([lbl,, checked]) => [lbl, checked]))
  );
  const [notifMsg, setNotifMsg] = useState('');
  const [notifSaving, setNotifSaving] = useState(false);

  useEffect(() => {
    if (user?.notifications_pref) {
      const defaults = Object.fromEntries(notifItems.map(([lbl,, checked]) => [lbl, checked]));
      setNotifState({ ...defaults, ...user.notifications_pref });
    }
  }, [user?.id]); // eslint-disable-line

  // Delete account
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function handleSave(e) {
    e.preventDefault();
    const pErr = validatePhone(form.phone);
    if (pErr) { setPhoneError(pErr); return; }
    setSaving(true); setSaveMsg('');
    try {
      // Never send email — it's the login ID and is read-only; exclude it to avoid accidental overwrites
      const { email: _email, ...payload } = form;
      const updated = await api.updateMe(payload);
      if (setUser) setUser(updated);
      setSaveMsg('✅ Changes saved successfully.');
    } catch (err) {
      setSaveMsg('❌ ' + err.message);
    } finally { setSaving(false); }
  }

  async function handlePassword(e) {
    e.preventDefault();
    setPwError(''); setPwMsg('');
    if (pwForm.newPw !== pwForm.confirm) { setPwError('New passwords do not match.'); return; }
    if (pwForm.newPw.length < 6) { setPwError('New password must be at least 6 characters.'); return; }
    setPwBusy(true);
    try {
      await api.changePassword(pwForm.current, pwForm.newPw);
      setPwMsg('✅ Password updated successfully.');
      setPwForm({ current: '', newPw: '', confirm: '' });
    } catch (err) {
      setPwError('❌ ' + err.message);
    } finally { setPwBusy(false); }
  }

  const card = {
    background: '#fff', borderRadius: 12, border: '1px solid #E0E6EF',
    padding: '20px 24px', marginBottom: 16, ...cardStyle,
  };
  const label = { fontSize: 11, fontWeight: 600, color: '#6B7FA3', textTransform: 'uppercase', letterSpacing: 0.5 };
  const input = { width: '100%', marginTop: 4, padding: '8px 10px', border: '1.5px solid #E0E6EF', borderRadius: 7, fontSize: 13, color: '#1A2B4A', boxSizing: 'border-box', outline: 'none' };
  const btn = { padding: '8px 20px', background: '#010E3C', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' };

  return (
    <div style={{ padding: '24px 28px', maxWidth: 700 }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#1A2B4A' }}>Account Preferences ⚙️</div>
        <div style={{ fontSize: 13, color: '#6B7FA3', marginTop: 4 }}>Manage your account settings and preferences</div>
      </div>

      {/* Account Info */}
      <div style={card}>
        <div style={{ fontWeight: 700, fontSize: 14, color: '#1A2B4A', marginBottom: 16 }}>👤 Account Information</div>
        <form onSubmit={handleSave}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {fields.map(([lbl, key]) => (
              <div key={key}>
                <label style={label}>{lbl}</label>
                <input
                  style={{ ...input, ...(key === 'phone' && phoneError ? { borderColor: '#EF4444' } : {}) }}
                  value={form[key] || ''}
                  onChange={e => {
                    const val = key === 'phone' ? e.target.value.replace(/\D/g, '').slice(0, 10) : e.target.value;
                    setForm(f => ({ ...f, [key]: val }));
                    if (key === 'phone') setPhoneError('');
                  }}
                  onBlur={key === 'phone' ? () => setPhoneError(validatePhone(form.phone)) : undefined}
                  disabled={key === 'email'}
                />
                {key === 'phone' && phoneError && <div style={{ color: '#EF4444', fontSize: 11, marginTop: 3 }}>{phoneError}</div>}
              </div>
            ))}
          </div>
          {saveMsg && <div style={{ marginTop: 10, fontSize: 13, color: saveMsg.startsWith('✅') ? '#1A7C3E' : '#DC2626' }}>{saveMsg}</div>}
          <div style={{ textAlign: 'right', marginTop: 16 }}>
            <button type="submit" style={btn} disabled={saving}>{saving ? 'Saving…' : '💾 Save Changes'}</button>
          </div>
        </form>
      </div>

      {/* Change Password */}
      <div style={card}>
        <div style={{ fontWeight: 700, fontSize: 14, color: '#1A2B4A', marginBottom: 16 }}>🔒 Change Password</div>
        <form onSubmit={handlePassword}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {[['Current Password','current','Current password'],['New Password','newPw','Min. 6 characters']].map(([lbl,key,ph]) => (
              <div key={key}>
                <label style={label}>{lbl}</label>
                <input type="password" placeholder={ph} style={input} value={pwForm[key]} onChange={e => setPwForm(f => ({ ...f, [key]: e.target.value }))} />
              </div>
            ))}
          </div>
          <div style={{ marginTop: 14 }}>
            <label style={label}>Confirm New Password</label>
            <input type="password" placeholder="Re-enter new password" style={{ ...input, maxWidth: 320 }} value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} />
          </div>
          {pwError && <div style={{ marginTop: 10, fontSize: 13, color: '#DC2626' }}>{pwError}</div>}
          {pwMsg && <div style={{ marginTop: 10, fontSize: 13, color: '#1A7C3E' }}>{pwMsg}</div>}
          <div style={{ textAlign: 'right', marginTop: 16 }}>
            <button type="submit" style={btn} disabled={pwBusy}>{pwBusy ? 'Updating…' : '🔐 Update Password'}</button>
          </div>
        </form>
      </div>

      {/* Notification Preferences */}
      <div style={card}>
        <div style={{ fontWeight: 700, fontSize: 14, color: '#1A2B4A', marginBottom: 16 }}>🔔 Notification Preferences</div>
        {notifItems.map(([lbl, sub]) => (
          <div key={lbl} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #F1F5F9' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1A2B4A' }}>{lbl}</div>
              <div style={{ fontSize: 11, color: '#6B7FA3', marginTop: 2 }}>{sub}</div>
            </div>
            <input type="checkbox" checked={!!notifState[lbl]}
              onChange={e => setNotifState(s => ({ ...s, [lbl]: e.target.checked }))}
              style={{ width: 16, height: 16, cursor: 'pointer' }} />
          </div>
        ))}
        {notifMsg && <div style={{ marginTop: 10, fontSize: 13, color: '#1A7C3E' }}>{notifMsg}</div>}
        <div style={{ textAlign: 'right', marginTop: 14 }}>
          <button style={btn} disabled={notifSaving} onClick={async () => {
            setNotifSaving(true);
            try {
              const updated = await api.updateMe({ notifications_pref: notifState });
              if (setUser) setUser(updated);
              setNotifMsg('✅ Notification preferences saved.');
            } catch { setNotifMsg('❌ Failed to save preferences.'); }
            finally {
              setNotifSaving(false);
              setTimeout(() => setNotifMsg(''), 3000);
            }
          }}>{notifSaving ? 'Saving…' : '💾 Save Preferences'}</button>
        </div>
      </div>

      {/* Account Actions */}
      <div style={card}>
        <div style={{ fontWeight: 700, fontSize: 14, color: '#1A2B4A', marginBottom: 16 }}>⚠️ Account Actions</div>
        {confirmDelete ? (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: 14, marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#DC2626', marginBottom: 8 }}>
              Are you sure? This will permanently delete your account and all data. This cannot be undone.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setConfirmDelete(false)}
                style={{ padding: '7px 16px', background: '#fff', color: '#3D5170', border: '1px solid #E0E6EF', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={() => {
                api.request && api.deleteMe
                  ? api.deleteMe().then(onLogout).catch(() => {})
                  : onLogout();
              }}
                style={{ padding: '7px 16px', background: '#DC2626', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Yes, Delete My Account
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => setConfirmDelete(true)}
              style={{ padding: '8px 18px', background: '#FEE2E2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              🗑️ Delete Account
            </button>
            <button onClick={onLogout}
              style={{ padding: '8px 18px', background: '#fff', color: '#3D5170', border: '1px solid #E0E6EF', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              🚪 Sign Out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
