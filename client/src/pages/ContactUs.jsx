import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ContactUs() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }
  function err(k, msg) { setErrors(e => ({ ...e, [k]: msg })); }
  function clearErr(k) { setErrors(e => ({ ...e, [k]: '' })); }

  function validateEmail(v) {
    if (!v.trim()) return 'Email is required';
    if (!/^[^\s@.][^\s@]{0,252}@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())) return 'Enter a valid email address';
    return '';
  }

  function handleSubmit(e) {
    e.preventDefault();
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = 'Name is required';
    const emailErr = validateEmail(form.email);
    if (emailErr) newErrors.email = emailErr;
    if (!form.subject.trim()) newErrors.subject = 'Subject is required';
    if (!form.message.trim()) newErrors.message = 'Message is required';
    if (Object.keys(newErrors).length) { setErrors(newErrors); return; }
    setSubmitted(true);
  }

  const inp = {
    width: '100%', padding: '10px 14px', borderRadius: 8, fontSize: 14,
    outline: 'none', boxSizing: 'border-box',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f8', fontFamily: 'Inter,sans-serif' }}>
      {/* Navbar */}
      <nav style={{ background: '#fff', borderBottom: '1px solid #e4e8ef', padding: '0 40px', height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => navigate('/')}>
          <img src="/logo.png" alt="SkillsNJobs" style={{ height: 34, width: 34, objectFit: 'contain' }} />
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: '#002060', lineHeight: 1.1 }}>SkillsNJobs</div>
            <div style={{ fontSize: 9, color: '#64748b', letterSpacing: '.06em', textTransform: 'uppercase' }}>India's Unified Skill Platform</div>
          </div>
        </div>
        <button onClick={() => navigate('/')} style={{ padding: '7px 18px', border: '1.5px solid #002060', borderRadius: 8, background: 'transparent', color: '#002060', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          ← Back to Home
        </button>
      </nav>

      {/* Hero banner */}
      <div style={{ background: 'linear-gradient(135deg,#001845 0%,#002060 60%,#0a3a8c 100%)', padding: '48px 40px 40px', textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 10 }}>📬</div>
        <h1 style={{ color: '#fff', fontSize: 28, fontWeight: 800, margin: '0 0 10px' }}>Contact Us</h1>
        <p style={{ color: 'rgba(255,255,255,.6)', fontSize: 14, maxWidth: 520, margin: '0 auto' }}>
          Have a question, feedback, or need help? Reach out to us and our team will get back to you within 24 hours.
        </p>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px', display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 32, alignItems: 'start' }}>

        {/* Info cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[
            { icon: '🏢', title: 'Head Office', lines: ['Skills n Jobs AI Technologies Private Limited', 'Plot No: 91, LVS Arcade, Jayabheri Enclave', 'Hitech City, Hyderabad, TN – 500084'] },
            { icon: '📞', title: 'Phone', lines: ['0000000000', 'Mon – Sat, 9 AM – 6 PM IST'] },
            { icon: '✉️', title: 'Email', lines: ['support@skillsnjobs.in', 'grievance@skillsnjobs.in'] },
            { icon: '🌐', title: 'Online Support', lines: ['Help Centre: help.skillsnjobs.in', 'Grievance Portal: grievance.skillsnjobs.in'] },
          ].map(({ icon, title, lines }) => (
            <div key={title} style={{ background: '#fff', borderRadius: 12, padding: '20px 22px', boxShadow: '0 1px 6px rgba(0,0,0,.07)', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{ fontSize: 26, flexShrink: 0, marginTop: 2 }}>{icon}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#002060', marginBottom: 6 }}>{title}</div>
                {lines.map(l => <div key={l} style={{ fontSize: 13, color: '#4b5563', lineHeight: 1.7 }}>{l}</div>)}
              </div>
            </div>
          ))}
        </div>

        {/* Contact form */}
        <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 2px 16px rgba(0,0,0,.08)', padding: '36px 36px' }}>
          {submitted ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ fontSize: 52, marginBottom: 16 }}>✅</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#002060', marginBottom: 10 }}>Message Sent!</div>
              <div style={{ fontSize: 14, color: '#64748b', marginBottom: 28, lineHeight: 1.7 }}>
                Thank you for reaching out. Our team will get back to you within 24 hours.
              </div>
              <button onClick={() => { setSubmitted(false); setForm({ name:'', email:'', phone:'', subject:'', message:'' }); }}
                style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: '#002060', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#002060', marginBottom: 24 }}>Send us a Message</div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Full Name <span style={{ color: '#dc2626' }}>*</span></label>
                  <input value={form.name} onChange={e => { set('name', e.target.value); clearErr('name'); }}
                    onBlur={() => !form.name.trim() && err('name', 'Name is required')}
                    placeholder="Your full name"
                    style={{ ...inp, border: `1.5px solid ${errors.name ? '#dc2626' : '#dde2eb'}` }} />
                  {errors.name && <div style={{ fontSize: 11.5, color: '#dc2626', marginTop: 4 }}>{errors.name}</div>}
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Email Address <span style={{ color: '#dc2626' }}>*</span></label>
                  <input type="email" value={form.email} onChange={e => { set('email', e.target.value); clearErr('email'); }}
                    onBlur={() => { const e = validateEmail(form.email); if (e) err('email', e); }}
                    placeholder="you@example.com"
                    style={{ ...inp, border: `1.5px solid ${errors.email ? '#dc2626' : '#dde2eb'}` }} />
                  {errors.email && <div style={{ fontSize: 11.5, color: '#dc2626', marginTop: 4 }}>{errors.email}</div>}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Phone Number</label>
                  <input value={form.phone} onChange={e => set('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="10-digit mobile number"
                    style={{ ...inp, border: '1.5px solid #dde2eb' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Subject <span style={{ color: '#dc2626' }}>*</span></label>
                  <select value={form.subject} onChange={e => { set('subject', e.target.value); clearErr('subject'); }}
                    onBlur={() => !form.subject && err('subject', 'Subject is required')}
                    style={{ ...inp, border: `1.5px solid ${errors.subject ? '#dc2626' : '#dde2eb'}`, background: '#fff' }}>
                    <option value="">Select a subject</option>
                    <option>General Enquiry</option>
                    <option>Technical Support</option>
                    <option>Training Partner Registration</option>
                    <option>Employer Onboarding</option>
                    <option>Grievance / Complaint</option>
                    <option>Scheme Information</option>
                    <option>Other</option>
                  </select>
                  {errors.subject && <div style={{ fontSize: 11.5, color: '#dc2626', marginTop: 4 }}>{errors.subject}</div>}
                </div>
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Message <span style={{ color: '#dc2626' }}>*</span></label>
                <textarea value={form.message} onChange={e => { set('message', e.target.value); clearErr('message'); }}
                  onBlur={() => !form.message.trim() && err('message', 'Message is required')}
                  placeholder="Describe your query or feedback in detail…"
                  rows={5}
                  style={{ ...inp, border: `1.5px solid ${errors.message ? '#dc2626' : '#dde2eb'}`, resize: 'vertical', fontFamily: 'inherit' }} />
                {errors.message && <div style={{ fontSize: 11.5, color: '#dc2626', marginTop: 4 }}>{errors.message}</div>}
              </div>

              <button type="submit"
                style={{ width: '100%', padding: '12px', borderRadius: 8, border: 'none', background: '#002060', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
                Send Message →
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', padding: '24px', fontSize: 12, color: '#94a3b8', borderTop: '1px solid #e4e8ef', marginTop: 16 }}>
        © 2026 SkillsNJobs. All rights reserved.
      </div>
    </div>
  );
}
