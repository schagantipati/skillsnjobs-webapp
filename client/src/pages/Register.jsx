import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api.js';

const ROLES = [
  { value: 'candidate', label: 'Candidate' },
  { value: 'employer', label: 'Employer' },
  { value: 'trainer', label: 'Trainer' },
  { value: 'placement_agency', label: 'Placement Agency' },
  { value: 'csr_org', label: 'CSR Organization' },
  { value: 'training_vendor', label: 'Training Vendor' },
];

const COUNTRY_CODES = [
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+1', country: 'USA', flag: '🇺🇸' },
  { code: '+44', country: 'UK', flag: '🇬🇧' },
  { code: '+61', country: 'Australia', flag: '🇦🇺' },
  { code: '+971', country: 'UAE', flag: '🇦🇪' },
  { code: '+65', country: 'Singapore', flag: '🇸🇬' },
  { code: '+60', country: 'Malaysia', flag: '🇲🇾' },
  { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦' },
];

const INDIA_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab',
  'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh',
  'Uttarakhand','West Bengal','Andaman & Nicobar','Chandigarh','Delhi',
  'Dadra & Nagar Haveli','Daman & Diu','Jammu & Kashmir','Ladakh','Lakshadweep','Puducherry',
];

const COUNTRIES = [
  'India','United States','United Kingdom','Australia','Canada','UAE',
  'Singapore','Malaysia','Saudi Arabia','Germany','France','Japan','Other',
];

function Field({ label, required, children, hint }) {
  return (
    <div className="field">
      <label>{label}{required && <span style={{ color: '#EF4444', marginLeft: 3 }}>*</span>}</label>
      {children}
      {hint && <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 3 }}>{hint}</div>}
    </div>
  );
}

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const photoRef = useRef();

  const [role, setRole] = useState('candidate');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Common fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [orgName, setOrgName] = useState('');
  const [skillsText, setSkillsText] = useState('');

  // Candidate-specific fields
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [phone, setPhone] = useState('');
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoBase64, setPhotoBase64] = useState('');
  const [addrLine1, setAddrLine1] = useState('');
  const [addrLine2, setAddrLine2] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [country, setCountry] = useState('India');
  const [pincode, setPincode] = useState('');

  // OTP state
  const [mobileOtpSent, setMobileOtpSent] = useState(false);
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [mobileOtp, setMobileOtp] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [mobileVerified, setMobileVerified] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [otpBusy, setOtpBusy] = useState('');
  const [devMobileOtp, setDevMobileOtp] = useState('');
  const [devEmailOtp, setDevEmailOtp] = useState('');

  function handlePhoto(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setError('Photo must be under 2MB'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPhotoPreview(ev.target.result);
      setPhotoBase64(ev.target.result);
    };
    reader.readAsDataURL(file);
  }

  function validatePhone() {
    const digits = phone.replace(/\D/g, '');
    if (digits.length !== 10) return 'Mobile number must be exactly 10 digits';
    return '';
  }

  function validateEmail() {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email address';
    return '';
  }

  async function sendOtp(type) {
    if (type === 'mobile') {
      const err = validatePhone();
      if (err) { setError(err); return; }
      setOtpBusy('mobile');
      try {
        const res = await api.sendOtp('mobile', countryCode + phone);
        setMobileOtpSent(true);
        setMobileVerified(false);
        setMobileOtp('');
        if (res.dev_otp) setDevMobileOtp(res.dev_otp);
        setError('');
      } catch (e) { setError(e.message); }
      finally { setOtpBusy(''); }
    } else {
      const err = validateEmail();
      if (err) { setError(err); return; }
      setOtpBusy('email');
      try {
        const res = await api.sendOtp('email', email);
        setEmailOtpSent(true);
        setEmailVerified(false);
        setEmailOtp('');
        if (res.dev_otp) setDevEmailOtp(res.dev_otp);
        setError('');
      } catch (e) { setError(e.message); }
      finally { setOtpBusy(''); }
    }
  }

  async function verifyOtp(type) {
    setOtpBusy(type);
    try {
      if (type === 'mobile') {
        await api.verifyOtp('mobile', countryCode + phone, mobileOtp);
        setMobileVerified(true);
        setError('');
      } else {
        await api.verifyOtp('email', email, emailOtp);
        setEmailVerified(true);
        setError('');
      }
    } catch (e) { setError(e.message); }
    finally { setOtpBusy(''); }
  }

  async function submit(e) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }

    if (role === 'candidate') {
      if (!firstName.trim() || !lastName.trim()) { setError('First name and last name are required'); return; }
      const phoneErr = validatePhone();
      if (phoneErr) { setError(phoneErr); return; }
      const emailErr = validateEmail();
      if (emailErr) { setError(emailErr); return; }
      if (!mobileVerified) { setError('Please verify your mobile number with OTP'); return; }
      if (!emailVerified) { setError('Please verify your email address with OTP'); return; }
      if (!dob) { setError('Date of birth is required'); return; }
      if (!gender) { setError('Gender is required'); return; }
      if (!addrLine1.trim()) { setError('Address Line 1 is required'); return; }
      if (!city.trim()) { setError('City is required'); return; }
      if (!pincode.trim()) { setError('PIN / ZIP code is required'); return; }
    }

    setBusy(true);
    try {
      const skills = skillsText.split(',').map(s => s.trim()).filter(Boolean);
      await register({
        email, password, role,
        org_name: orgName || null,
        location: city || null,
        skills,
        // Candidate fields
        first_name: firstName || null,
        middle_name: middleName || null,
        last_name: lastName || null,
        dob: dob || null,
        gender: gender || null,
        phone: phone ? countryCode + phone : null,
        address_line1: addrLine1 || null,
        address_line2: addrLine2 || null,
        city: city || null,
        state_name: stateName || null,
        country: country || 'India',
        pincode: pincode || null,
        photo: photoBase64 || null,
        mobile_verified: mobileVerified,
        email_verified: emailVerified,
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const isCandidate = role === 'candidate';

  return (
    <div className="auth-wrap" style={{ padding: '32px 16px' }}>
      <div className="auth-card" style={{ maxWidth: isCandidate ? 680 : 480, width: '100%' }}>
        <div className="auth-logo"><div className="mark">🎯</div><span>SkillsNJobs</span></div>
        <h2>Create your account</h2>
        <p className="sub">Connect skills, jobs and training in one place.</p>

        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={submit}>
          {/* Role selector */}
          <div style={{ marginBottom: 22 }}>
            <label style={{ fontWeight: 600, fontSize: 13, color: 'var(--ink-2)', display: 'block', marginBottom: 8 }}>
              I am a <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <div className="role-pick" style={{ flexWrap: 'wrap' }}>
              {ROLES.map(r => (
                <div key={r.value}
                  className={'role-opt' + (role === r.value ? ' active' : '')}
                  onClick={() => { setRole(r.value); setError(''); }}>
                  {r.label}
                </div>
              ))}
            </div>
          </div>

          {/* ── CANDIDATE FIELDS ── */}
          {isCandidate && (
            <>
              {/* Name row */}
              <div style={{ marginTop: 80 }} />
              <div className="grid grid-3">
                <Field label="First Name" required>
                  <input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="First name" required />
                </Field>
                <Field label="Middle Name">
                  <input value={middleName} onChange={e => setMiddleName(e.target.value)} placeholder="Middle name" />
                </Field>
                <Field label="Last Name" required>
                  <input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Last name" required />
                </Field>
              </div>

              {/* DOB & Gender */}
              <div className="grid grid-2">
                <Field label="Date of Birth" required>
                  <input type="date" value={dob} onChange={e => setDob(e.target.value)}
                    max={new Date(Date.now() - 16 * 365.25 * 86400000).toISOString().split('T')[0]} required />
                </Field>
                <Field label="Gender" required>
                  <select value={gender} onChange={e => setGender(e.target.value)} required>
                    <option value="">Select gender</option>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Transgender</option>
                    <option>Prefer not to say</option>
                  </select>
                </Field>
              </div>

              {/* Address */}
              <div style={{ background: '#F8FAFC', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px', marginBottom: 14 }}>
                <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--ink-3)', marginBottom: 10, letterSpacing: 0.5 }}>ADDRESS</div>
                <Field label="Address Line 1" required>
                  <input value={addrLine1} onChange={e => setAddrLine1(e.target.value)} placeholder="House / Flat No., Street, Area" required />
                </Field>
                <Field label="Address Line 2">
                  <input value={addrLine2} onChange={e => setAddrLine2(e.target.value)} placeholder="Landmark, Colony (optional)" />
                </Field>
                <div className="grid grid-2">
                  <Field label="City / Town" required>
                    <input value={city} onChange={e => setCity(e.target.value)} placeholder="City" required />
                  </Field>
                  <Field label="State / Province" required>
                    {country === 'India' ? (
                      <select value={stateName} onChange={e => setStateName(e.target.value)} required>
                        <option value="">Select state</option>
                        {INDIA_STATES.map(s => <option key={s}>{s}</option>)}
                      </select>
                    ) : (
                      <input value={stateName} onChange={e => setStateName(e.target.value)} placeholder="State / Province" required />
                    )}
                  </Field>
                </div>
                <div className="grid grid-2">
                  <Field label="Country" required>
                    <select value={country} onChange={e => setCountry(e.target.value)} required>
                      {COUNTRIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </Field>
                  <Field label={country === 'India' ? 'PIN Code' : 'ZIP / Postal Code'} required>
                    <input value={pincode} onChange={e => setPincode(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder={country === 'India' ? '6-digit PIN' : 'Postal code'} required />
                  </Field>
                </div>
              </div>

              {/* Mobile with OTP */}
              <div style={{ background: '#F8FAFC', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px', marginBottom: 14 }}>
                <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--ink-3)', marginBottom: 10, letterSpacing: 0.5 }}>MOBILE VERIFICATION</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                  <Field label="Country Code" required>
                    <select value={countryCode} onChange={e => setCountryCode(e.target.value)} style={{ width: 130 }} disabled={mobileVerified}>
                      {COUNTRY_CODES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code} {c.country}</option>)}
                    </select>
                  </Field>
                  <div className="field" style={{ flex: 1 }}>
                    <label>Mobile Number <span style={{ color: '#EF4444' }}>*</span></label>
                    <input value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="10-digit number" maxLength={10} disabled={mobileVerified} required />
                  </div>
                  <button type="button" className={`btn btn-sm ${mobileVerified ? 'btn-outline' : 'btn-primary'}`}
                    style={{ marginBottom: 1, minWidth: 100, background: mobileVerified ? '#10B981' : undefined, color: mobileVerified ? '#fff' : undefined, borderColor: mobileVerified ? '#10B981' : undefined }}
                    onClick={() => !mobileVerified && sendOtp('mobile')}
                    disabled={otpBusy === 'mobile' || mobileVerified}>
                    {mobileVerified ? '✓ Verified' : otpBusy === 'mobile' ? 'Sending…' : mobileOtpSent ? 'Resend OTP' : 'Send OTP'}
                  </button>
                </div>
                {mobileOtpSent && !mobileVerified && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <input value={mobileOtp} onChange={e => setMobileOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="Enter 6-digit OTP" maxLength={6} style={{ flex: 1, letterSpacing: 4, fontSize: 18, textAlign: 'center' }} />
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => verifyOtp('mobile')} disabled={otpBusy === 'mobile' || mobileOtp.length !== 6}>
                      {otpBusy === 'mobile' ? 'Verifying…' : 'Verify'}
                    </button>
                  </div>
                )}
                {devMobileOtp && !mobileVerified && (
                  <div style={{ fontSize: 11, color: '#F59E0B', marginTop: 6, background: '#FFFBEB', padding: '4px 8px', borderRadius: 6 }}>
                    🔧 Dev mode — OTP: <strong>{devMobileOtp}</strong>
                  </div>
                )}
              </div>

              {/* Email with OTP */}
              <div style={{ background: '#F8FAFC', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px', marginBottom: 14 }}>
                <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--ink-3)', marginBottom: 10, letterSpacing: 0.5 }}>EMAIL VERIFICATION</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                  <div className="field" style={{ flex: 1 }}>
                    <label>Email Address <span style={{ color: '#EF4444' }}>*</span></label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="yourname@example.com" disabled={emailVerified} required />
                  </div>
                  <button type="button" className={`btn btn-sm ${emailVerified ? 'btn-outline' : 'btn-primary'}`}
                    style={{ marginBottom: 1, minWidth: 100, background: emailVerified ? '#10B981' : undefined, color: emailVerified ? '#fff' : undefined, borderColor: emailVerified ? '#10B981' : undefined }}
                    onClick={() => !emailVerified && sendOtp('email')}
                    disabled={otpBusy === 'email' || emailVerified}>
                    {emailVerified ? '✓ Verified' : otpBusy === 'email' ? 'Sending…' : emailOtpSent ? 'Resend OTP' : 'Send OTP'}
                  </button>
                </div>
                {emailOtpSent && !emailVerified && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <input value={emailOtp} onChange={e => setEmailOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="Enter 6-digit OTP" maxLength={6} style={{ flex: 1, letterSpacing: 4, fontSize: 18, textAlign: 'center' }} />
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => verifyOtp('email')} disabled={otpBusy === 'email' || emailOtp.length !== 6}>
                      {otpBusy === 'email' ? 'Verifying…' : 'Verify'}
                    </button>
                  </div>
                )}
                {devEmailOtp && !emailVerified && (
                  <div style={{ fontSize: 11, color: '#F59E0B', marginTop: 6, background: '#FFFBEB', padding: '4px 8px', borderRadius: 6 }}>
                    🔧 Dev mode — OTP: <strong>{devEmailOtp}</strong>
                  </div>
                )}
              </div>

            </>
          )}

          {/* ── NON-CANDIDATE FIELDS ── */}
          {!isCandidate && (
            <>
              <Field label="Full Name" required>
                <input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Your full name" required />
              </Field>
              <Field label="Email Address" required>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="yourname@example.com" required />
              </Field>
              {role !== 'candidate' && (
                <Field label="Organization Name">
                  <input value={orgName} onChange={e => setOrgName(e.target.value)} placeholder="e.g. TechNova Pvt Ltd" />
                </Field>
              )}
            </>
          )}

          {/* Password */}
          <div className="grid grid-2">
            <Field label="Password" required hint="Minimum 6 characters">
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
            </Field>
            <Field label="Confirm Password" required>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
            </Field>
          </div>

          {/* OTP status summary for candidate */}
          {isCandidate && (
            <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 12, padding: '4px 10px', borderRadius: 99, background: mobileVerified ? '#D1FAE5' : '#FEF3C7', color: mobileVerified ? '#065F46' : '#92400E', fontWeight: 600 }}>
                {mobileVerified ? '✓ Mobile verified' : '⚠ Mobile not verified'}
              </div>
              <div style={{ fontSize: 12, padding: '4px 10px', borderRadius: 99, background: emailVerified ? '#D1FAE5' : '#FEF3C7', color: emailVerified ? '#065F46' : '#92400E', fontWeight: 600 }}>
                {emailVerified ? '✓ Email verified' : '⚠ Email not verified'}
              </div>
            </div>
          )}

          <button className="btn btn-primary btn-block" disabled={busy} style={{ marginTop: 4 }}>
            {busy ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <div className="auth-switch" style={{ marginTop: 16 }}>
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
