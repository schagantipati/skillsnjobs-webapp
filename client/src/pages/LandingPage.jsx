import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { api } from '../api.js';

/* ─── data ──────────────────────────────────────────────────────── */
const TICKER_ITEMS = [
  '🏅 PMKVY 4.0 enrolments open — Apply now',
  '🌾 DDU-GKY: 50,000 seats available for rural youth',
  '💼 NAPS Apprenticeship scheme — Register your organisation today',
  '🤖 New batch: AI & Data Analytics short course — Starts Aug 2026',
  '💚 CSR funding available for skilling initiatives — Know more',
  '📜 Digital certificates now blockchain-verified — Learn more',
];

const PORTALS = [
  { tKey:'portal_candidate',  desc:'Browse courses, apply to jobs, track your skill journey.',                   icon:'🎓', color:'#16A34A', bg:'#DCFCE7', border:'#4ADE80', href:'/candidate-portal' },
  { tKey:'portal_employer',   desc:'Post jobs, discover skilled candidates, manage hiring.',                     icon:'🏢', color:'#1D4ED8', bg:'#DBEAFE', border:'#60A5FA', href:'/employer-portal' },
  { tKey:'portal_trainer',    desc:'Manage batches, track learner progress, submit assessments.',                icon:'📋', color:'#BE185D', bg:'#FCE7F3', border:'#F472B6', href:'/trainer-portal' },
  { tKey:'portal_vendor',     desc:'Register your centre, manage programmes, get govt tie-ups.',                 icon:'🏫', color:'#D97706', bg:'#FEF3C7', border:'#FBBF24', href:'/vendor-portal' },
  { tKey:'portal_csr',        desc:'Channel CSR funds into verified skilling projects and track impact.',        icon:'🤝', color:'#7C3AED', bg:'#EDE9FE', border:'#A78BFA', href:'/csr-portal' },
  { tKey:'portal_placement',  desc:'Connect trained candidates to employers, track placements.',                 icon:'🔗', color:'#EA580C', bg:'#FFEDD5', border:'#FB923C', href:'/placement-partner-portal' },
  { tKey:'portal_stategov',   desc:'Monitor targets, disburse funds, access district-level MIS.',              icon:'🏛️', color:'#059669', bg:'#D1FAE5', border:'#34D399', href:'/state-govt-portal', loginRole:'state_gov' },
  { tKey:'portal_admin',      desc:'Platform-wide oversight, user management, audit logs.',                     icon:'🛡️', color:'#475569', bg:'#F1F5F9', border:'#94A3B8', href:'/dashboard',          loginRole:'superadmin' },
];

const SECTORS = [
  { icon:'💻', label:'IT & ITeS',         count:'340+ courses', color:'#1D4ED8', bg:'#DBEAFE' },
  { icon:'🏥', label:'Healthcare',         count:'180+ courses', color:'#BE185D', bg:'#FCE7F3' },
  { icon:'🚚', label:'Logistics',          count:'120+ courses', color:'#D97706', bg:'#FEF3C7' },
  { icon:'🏦', label:'BFSI',              count:'210+ courses', color:'#059669', bg:'#D1FAE5' },
  { icon:'🛒', label:'Retail',             count:'95+ courses',  color:'#EA580C', bg:'#FFEDD5' },
  { icon:'🚗', label:'Automotive',         count:'140+ courses', color:'#7C3AED', bg:'#EDE9FE' },
  { icon:'🏗️', label:'Construction',       count:'88+ courses',  color:'#0891B2', bg:'#CFFAFE' },
  { icon:'👗', label:'Apparel & Textiles', count:'72+ courses',  color:'#C2410C', bg:'#FFF7ED' },
  { icon:'🍽️', label:'Tourism & Hospitality', count:'96+ courses', color:'#4D7C0F', bg:'#ECFCCB' },
  { icon:'⚡', label:'Electronics',        count:'160+ courses', color:'#B45309', bg:'#FEF9C3' },
];

const SCHEMES = [
  { name:'PMKVY 4.0',    icon:'🏅', bg:'#EFF6FF', color:'#1D4ED8', desc:'Free short-term skill training with certification and placement support for Indian youth.', stat:'8,800+', statLbl:'Training centres registered' },
  { name:'DDU-GKY',      icon:'🌾', bg:'#F0FDF4', color:'#16A34A', desc:'Skilling and placement programme focused on rural youth from BPL families.', stat:'2.4L+', statLbl:'Rural youth trained' },
  { name:'NAPS',         icon:'💼', bg:'#FFF7ED', color:'#EA580C', desc:'Government shares 25% of stipend costs with employers who hire apprentices.', stat:'1.1L', statLbl:'Active apprentices' },
  { name:'State Schemes',icon:'🗺️', bg:'#FAF5FF', color:'#7C3AED', desc:'Access state-specific skilling initiatives and scholarships across 28 states.', stat:'28', statLbl:'States integrated' },
  { name:'Digital Skills',icon:'💻', bg:'#FFF1F2', color:'#BE123C', desc:'AI, data analytics, coding, cloud computing, and cybersecurity courses.', stat:'340+', statLbl:'Digital courses available' },
  { name:'CSR Skilling', icon:'💚', bg:'#ECFDF5', color:'#059669', desc:'Fund and track skilling projects through a transparent CSR portal.', stat:'₹480Cr', statLbl:'CSR funds channelled' },
];

const FEATURES = [
  { icon:'🌐', title:'13 Indian Languages', desc:'Candidates access courses, certificates, and job listings in their native language.', color:'#60A5FA' },
  { icon:'📊', title:'Real-time MIS',        desc:'Live district, state, and national dashboards for instant tracking of targets.', color:'#34D399' },
  { icon:'📜', title:'Blockchain Certificates', desc:'Verifiable skill certificates authenticated instantly via QR code.', color:'#FBBF24' },
  { icon:'🤖', title:'AI Job Matching',      desc:'Smart engine scores candidate-job compatibility by skills, location, and sector.', color:'#F472B6' },
  { icon:'🔒', title:'Secure & Auditable',   desc:'End-to-end audit logs, role-based access control, OWASP Top 10 standards.', color:'#A78BFA' },
  { icon:'📱', title:'Mobile-First',         desc:'Works on low-bandwidth networks. Offline mode for attendance & assessments.', color:'#FB923C' },
];

const TESTIMONIALS = [
  { quote:'I completed the PMKVY logistics course and got placed at Amazon within 3 weeks. SkillsNJobs made the entire process seamless — from enrolment to offer letter.', name:'Aisha Khan', role:'Warehouse Associate, Nagpur', initials:'AK', color:'#16A34A', stars:5 },
  { quote:'The AI-matched candidate profiles save us weeks of screening. 80% of our warehouse hires in 2025 came through SkillsNJobs and they\'re better prepared than ever.', name:'HR Manager, TechNova', role:'Employer, Pune', initials:'HR', color:'#1D4ED8', stars:5 },
  { quote:'Managing DDU-GKY batches across 14 districts is now effortless. The MIS dashboard gives our team real-time visibility we never had with spreadsheets.', name:'State Administrator', role:'Government of Rajasthan', initials:'SA', color:'#7C3AED', stars:5 },
  { quote:'Our CSR spends now reach verified beneficiaries with full audit trail. The project tracking dashboard is exactly what our compliance team needed.', name:'CSR Head, Mahindra Group', role:'CSR Organisation, Mumbai', initials:'MG', color:'#EA580C', stars:5 },
];

const FAQS = [
  { q:'Is SkillsNJobs free for candidates?', a:'Yes — registration, course browsing, and application submission are completely free for candidates. Some premium certification courses may have fees which are often subsidised under government schemes.' },
  { q:'Which government schemes are supported?', a:'We support PMKVY 4.0, DDU-GKY, NAPS, NATS, STAR Scheme, and 28+ state-specific skilling schemes. Applications are made directly through the platform.' },
  { q:'How do I verify a certificate issued on SkillsNJobs?', a:'Every certificate has a unique QR code. Scan it or visit our certificate verification portal and enter the certificate ID to instantly verify authenticity.' },
  { q:'How can my organisation become a Training Partner?', a:'Register as a Training Vendor, complete your profile, upload accreditation documents, and submit for NSDC/state nodal agency approval. The entire process is digital and takes 3–5 business days.' },
  { q:'Is the platform available in regional languages?', a:'Yes — SkillsNJobs supports 13 Indian languages including Hindi, Tamil, Telugu, Kannada, Bengali, Marathi, Gujarati, and more. Language can be changed from any portal.' },
  { q:'How does the AI job matching work?', a:'Our engine analyses your skills, certifications, location, sector, and experience level, then scores compatibility against active job listings and notifies you of the best matches in real time.' },
];

const PARTNERS = ['NSDC','Ministry of Skill Development','ASCI','IT-ITeS SSC','BFSI SSC','Healthcare SSC','Logistics SSC','Retail SSC','TCS iON','Wipro','Infosys BPM','Amazon India','Flipkart','HDFC Bank','Apollo Hospitals','Maruti Suzuki','L&T','Mahindra','TATA Group','Bosch India'];

const NEWS = [
  { tag:'Update', color:'#1D4ED8', bg:'#DBEAFE', date:'Jul 5, 2026', title:'PMKVY 4.0 Phase II — New Demand-Led Courses Added', desc:'35 new job-role courses aligned with industry demand added across IT, Green Energy, and Healthcare sectors.' },
  { tag:'Partnership', color:'#059669', bg:'#D1FAE5', date:'Jul 2, 2026', title:'SkillsNJobs Partners with 3 New Sector Skill Councils', desc:'Electronics, Gems & Jewellery, and Tourism SSCs now integrated for direct assessment and certification.' },
  { tag:'Policy', color:'#D97706', bg:'#FEF3C7', date:'Jun 28, 2026', title:'Union Budget 2026: ₹1,200 Cr Allocated for Digital Skilling', desc:'Government increases digital skilling allocation by 34%. SkillsNJobs designated as implementation partner.' },
];

/* ─── helpers ────────────────────────────────────────────────────── */
function Stars({ n = 5 }) {
  return <div style={{ display:'flex', gap:2, marginBottom:12 }}>{Array.from({length:n}).map((_,i)=><span key={i} style={{ color:'#F59E0B', fontSize:14 }}>★</span>)}</div>;
}

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ border:'1px solid #e0e8f4', borderRadius:12, overflow:'hidden', marginBottom:10 }}>
      <button onClick={() => setOpen(v => !v)} style={{ width:'100%', textAlign:'left', padding:'18px 22px', background:open?'#002060':'#fff', border:'none', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center', transition:'background .2s' }}>
        <span style={{ fontSize:14, fontWeight:700, color:open?'#fff':'#002060' }}>{q}</span>
        <span style={{ fontSize:20, color:open?'#60A5FA':'#94A3B8', fontWeight:300, lineHeight:1, flexShrink:0, marginLeft:12 }}>{open?'−':'+'}</span>
      </button>
      {open && <div style={{ padding:'16px 22px', fontSize:13, color:'#4b5563', lineHeight:1.8, background:'#f8fafc', borderTop:'1px solid #e0e8f4' }}>{a}</div>}
    </div>
  );
}

function ContactForm() {
  const [form, setForm] = useState({ name:'', email:'', phone:'', subject:'', message:'' });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  function set(k, v) { setForm(f => ({ ...f, [k]:v })); }
  function setErr(k, msg) { setErrors(e => ({ ...e, [k]:msg })); }
  function clearErr(k) { setErrors(e => ({ ...e, [k]:'' })); }
  function validateEmail(v) {
    if (!v.trim()) return 'Email is required';
    if (!/^[^\s@.][^\s@]{0,252}@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())) return 'Enter a valid email address';
    return '';
  }
  function handleSubmit(e) {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    const emailErr = validateEmail(form.email);
    if (emailErr) errs.email = emailErr;
    if (!form.subject) errs.subject = 'Subject is required';
    if (!form.message.trim()) errs.message = 'Message is required';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSubmitted(true);
  }
  const inp = { width:'100%', padding:'10px 14px', borderRadius:8, fontSize:13.5, outline:'none', boxSizing:'border-box', fontFamily:'inherit' };
  if (submitted) return (
    <div style={{ background:'#fff', borderRadius:14, boxShadow:'0 2px 16px rgba(0,0,0,.08)', padding:'48px 36px', textAlign:'center' }}>
      <div style={{ fontSize:52, marginBottom:16 }}>✅</div>
      <div style={{ fontSize:20, fontWeight:800, color:'#002060', marginBottom:10 }}>Message Sent!</div>
      <div style={{ fontSize:14, color:'#64748b', marginBottom:28, lineHeight:1.7 }}>Thank you for reaching out. Our team will respond within 24 hours.</div>
      <button onClick={() => { setSubmitted(false); setForm({ name:'', email:'', phone:'', subject:'', message:'' }); }}
        style={{ padding:'10px 24px', borderRadius:8, border:'none', background:'#002060', color:'#fff', fontWeight:700, fontSize:14, cursor:'pointer' }}>
        Send Another Message
      </button>
    </div>
  );
  return (
    <form onSubmit={handleSubmit} noValidate style={{ background:'#fff', borderRadius:14, boxShadow:'0 2px 16px rgba(0,0,0,.08)', padding:'32px 32px' }}>
      <div style={{ fontSize:17, fontWeight:800, color:'#002060', marginBottom:22 }}>Send us a Message</div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
        <div>
          <label style={{ fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>Full Name <span style={{ color:'#dc2626' }}>*</span></label>
          <input value={form.name} onChange={e => { set('name', e.target.value); clearErr('name'); }}
            onBlur={() => !form.name.trim() && setErr('name','Name is required')}
            placeholder="Your full name" style={{ ...inp, border:`1.5px solid ${errors.name?'#dc2626':'#dde2eb'}` }} />
          {errors.name && <div style={{ fontSize:11.5, color:'#dc2626', marginTop:4 }}>{errors.name}</div>}
        </div>
        <div>
          <label style={{ fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>Email Address <span style={{ color:'#dc2626' }}>*</span></label>
          <input type="email" value={form.email} onChange={e => { set('email', e.target.value); clearErr('email'); }}
            onBlur={() => { const e = validateEmail(form.email); if (e) setErr('email', e); }}
            placeholder="you@example.com" style={{ ...inp, border:`1.5px solid ${errors.email?'#dc2626':'#dde2eb'}` }} />
          {errors.email && <div style={{ fontSize:11.5, color:'#dc2626', marginTop:4 }}>{errors.email}</div>}
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
        <div>
          <label style={{ fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>Phone Number</label>
          <input value={form.phone} onChange={e => set('phone', e.target.value.replace(/\D/g,'').slice(0,10))}
            placeholder="10-digit mobile" style={{ ...inp, border:'1.5px solid #dde2eb' }} />
        </div>
        <div>
          <label style={{ fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>Subject <span style={{ color:'#dc2626' }}>*</span></label>
          <select value={form.subject} onChange={e => { set('subject', e.target.value); clearErr('subject'); }}
            onBlur={() => !form.subject && setErr('subject','Subject is required')}
            style={{ ...inp, border:`1.5px solid ${errors.subject?'#dc2626':'#dde2eb'}`, background:'#fff' }}>
            <option value="">Select a subject</option>
            <option>General Enquiry</option>
            <option>Technical Support</option>
            <option>Training Partner Registration</option>
            <option>Employer Onboarding</option>
            <option>Grievance / Complaint</option>
            <option>Scheme Information</option>
            <option>Other</option>
          </select>
          {errors.subject && <div style={{ fontSize:11.5, color:'#dc2626', marginTop:4 }}>{errors.subject}</div>}
        </div>
      </div>
      <div style={{ marginBottom:22 }}>
        <label style={{ fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>Message <span style={{ color:'#dc2626' }}>*</span></label>
        <textarea value={form.message} onChange={e => { set('message', e.target.value); clearErr('message'); }}
          onBlur={() => !form.message.trim() && setErr('message','Message is required')}
          placeholder="Describe your query or feedback…" rows={4}
          style={{ ...inp, border:`1.5px solid ${errors.message?'#dc2626':'#dde2eb'}`, resize:'vertical' }} />
        {errors.message && <div style={{ fontSize:11.5, color:'#dc2626', marginTop:4 }}>{errors.message}</div>}
      </div>
      <button type="submit" style={{ width:'100%', padding:'12px', borderRadius:8, border:'none', background:'#002060', color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer' }}>
        Send Message →
      </button>
    </form>
  );
}

/* ─── Language switcher ──────────────────────────────────────────── */
function LanguageSwitcher() {
  const { lang, changeLang, LANGUAGES, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = LANGUAGES.find(l => l.code === lang) || LANGUAGES[0];

  useEffect(() => {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position:'relative' }}>
      <button
        onClick={() => setOpen(v => !v)}
        title={t('lang_select')}
        style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 12px', border:'1.5px solid #e0e8f4', borderRadius:8, background:'#fff', color:'#002060', fontSize:13, fontWeight:600, cursor:'pointer', transition:'border-color .15s' }}
        onMouseEnter={e => e.currentTarget.style.borderColor='#002060'}
        onMouseLeave={e => e.currentTarget.style.borderColor='#e0e8f4'}
      >
        <span style={{ fontSize:16 }}>🌐</span>
        <span>{current.native}</span>
        <span style={{ fontSize:10, color:'#94a3b8' }}>▾</span>
      </button>

      {open && (
        <div style={{ position:'absolute', top:'calc(100% + 6px)', right:0, background:'#fff', border:'1.5px solid #e0e8f4', borderRadius:12, boxShadow:'0 8px 32px rgba(0,0,0,.12)', zIndex:9999, minWidth:210, overflow:'hidden' }}>
          <div style={{ padding:'8px 14px 6px', fontSize:10, fontWeight:700, color:'#94a3b8', letterSpacing:0.8, textTransform:'uppercase', borderBottom:'1px solid #f1f5f9' }}>
            {t('lang_select')}
          </div>
          <div style={{ maxHeight:340, overflowY:'auto' }}>
            {LANGUAGES.map(l => (
              <div key={l.code}
                onClick={() => { changeLang(l.code); setOpen(false); }}
                style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'9px 14px', cursor:'pointer', background: l.code === lang ? '#EFF6FF':'transparent', transition:'background .1s' }}
                onMouseEnter={e => { if (l.code !== lang) e.currentTarget.style.background='#f8fafc'; }}
                onMouseLeave={e => { if (l.code !== lang) e.currentTarget.style.background='transparent'; }}
              >
                <div>
                  <span style={{ fontSize:13, fontWeight:600, color:'#001845' }}>{l.native}</span>
                  <span style={{ fontSize:11, color:'#94a3b8', marginLeft:6 }}>{l.label}</span>
                </div>
                {l.code === lang && <span style={{ color:'#1A56C4', fontSize:14, fontWeight:700 }}>✓</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── main component ─────────────────────────────────────────────── */
export default function LandingPage() {
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();
  const { t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // ticker
  const [tickIdx, setTickIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTickIdx(i => (i+1) % TICKER_ITEMS.length), 3500);
    return () => clearInterval(id);
  }, []);

  const [showRegister, setShowRegister] = useState(false);
  const [regRole, setRegRole] = useState('');
  const [regStep, setRegStep] = useState('role');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regOrg, setRegOrg] = useState('');
  const [regError, setRegError] = useState('');
  const [registering, setRegistering] = useState(false);

  const [chatOpen,    setChatOpen]   = useState(false);
  const [chatMsgs,    setChatMsgs]   = useState([{ role:'assistant', text:'Hi! 👋 I\'m your SkillsnJobs AI assistant. Ask me about courses, jobs, schemes, or how to register.' }]);
  const [chatInput,   setChatInput]  = useState('');
  const [chatLoading, setChatLoading]= useState(false);

  async function sendChatMessage() {
    const text = chatInput.trim();
    if (!text || chatLoading) return;
    const history = chatMsgs.map(m => ({ role: m.role, content: m.text }));
    setChatMsgs(m => [...m, { role:'user', text }]);
    setChatInput('');
    setChatLoading(true);
    try {
      const res = await api.chatbot(text, history);
      setChatMsgs(m => [...m, { role:'assistant', text: res?.reply || res?.message || 'Sorry, I could not process that.' }]);
    } catch {
      setChatMsgs(m => [...m, { role:'assistant', text: 'Sorry, something went wrong. Please try again.' }]);
    } finally { setChatLoading(false); }
  }

  const ROLES = [
    { label:'Candidate',        icon:'🎓', desc:'Find courses & jobs',        value:'candidate' },
    { label:'Employer',         icon:'🏢', desc:'Hire skilled talent',         value:'employer' },
    { label:'Trainer',          icon:'📋', desc:'Manage your batches',         value:'trainer' },
    { label:'Training Vendor',  icon:'🏫', desc:'List your organisation',      value:'training_vendor' },
    { label:'CSR Organisation', icon:'🤝', desc:'Fund skilling projects',      value:'csr_org' },
    { label:'Placement Partner',icon:'🔗', desc:'Drive placements',            value:'placement_agency' },
  ];

  function openRegister() { setShowRegister(true); setRegStep('role'); setRegRole(''); setRegError(''); setRegName(''); setRegEmail(''); setRegPassword(''); setRegOrg(''); }
  function closeRegister() { setShowRegister(false); }
  function selectRole(role) { closeRegister(); navigate('/register?role=' + role); }

  async function handleRegister(e) {
    e.preventDefault(); setRegError(''); setRegistering(true);
    try {
      const needsOrg = ['training_vendor','csr_org','placement_agency','employer'].includes(regRole);
      await registerUser({ name:regName, email:regEmail, password:regPassword, role:regRole, ...(needsOrg && regOrg ? { org_name:regOrg } : {}) });
      navigate('/dashboard');
    } catch (err) { setRegError(err.message || 'Registration failed. Please try again.'); }
    finally { setRegistering(false); }
  }

  useEffect(() => {
    function handler(e) { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const sec = { padding:'80px 40px' };
  const pill = (txt, dark) => (
    <div style={{ display:'inline-flex', alignItems:'center', marginBottom:16 }}>
      <span style={{ fontSize:11, fontWeight:700, letterSpacing:1, textTransform:'uppercase', color:dark?'rgba(255,255,255,.6)':'#1A56C4', background:dark?'rgba(255,255,255,.1)':'#EFF6FF', borderRadius:20, padding:'5px 16px', border:dark?'1px solid rgba(255,255,255,.15)':'1px solid #BFDBFE' }}>{txt}</span>
    </div>
  );
  const h2 = (txt, dark) => <h2 style={{ fontSize:32, fontWeight:800, color:dark?'#fff':'#001845', letterSpacing:-0.6, margin:'4px 0 10px', lineHeight:1.2 }}>{txt}</h2>;
  const sub = (txt, dark) => <p style={{ fontSize:14.5, color:dark?'rgba(255,255,255,.55)':'#5a6a8a', lineHeight:1.8, maxWidth:520, margin:'0 0 40px' }}>{txt}</p>;

  return (
    <div style={{ fontFamily:"'Inter',system-ui,sans-serif", color:'#1a1a2e', background:'#fff', fontSize:14, lineHeight:1.6, overflowX:'hidden', paddingTop:60 }}>

      {/* ── NAVBAR ── */}
      <nav style={{ position:'fixed', top:0, left:0, right:0, zIndex:100, background:'rgba(255,255,255,0.97)', backdropFilter:'blur(12px)', borderBottom:'1px solid #e0e8f4', padding:'0 40px', display:'flex', alignItems:'center', justifyContent:'space-between', height:60 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer' }} onClick={() => window.scrollTo({ top:0, behavior:'smooth' })}>
          <div style={{ width:44, height:44, borderRadius:'50%', border:'2px solid #e0e8f4', background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', flexShrink:0 }}>
            <img src="/logo.png" alt="SkillsNJobs" style={{ height:34, width:34, objectFit:'contain' }} />
          </div>
          <div>
            <div style={{ fontSize:16, fontWeight:800, color:'#002060', letterSpacing:-0.3 }}>SkillsNJobs</div>
            <div style={{ fontSize:9, color:'#5a6a8a', letterSpacing:0.5, textTransform:'uppercase', marginTop:-2 }}>India's Unified Skill Platform</div>
          </div>
        </div>
        <ul style={{ display:'flex', gap:26, listStyle:'none', margin:0, padding:0 }}>
          {[['nav_about','#about'],['nav_schemes','#schemes'],['nav_sectors','#sectors'],['nav_partners','#partners'],['nav_news','#news'],['nav_faq','#faq'],['nav_contact','#contact']].map(([key,href]) => (
            <li key={key}><a href={href} onClick={e => { e.preventDefault(); document.querySelector(href)?.scrollIntoView({ behavior:'smooth' }); }}
              style={{ fontSize:13, color:'#5a6a8a', textDecoration:'none', fontWeight:500, cursor:'pointer' }}>{t(key)}</a></li>
          ))}
        </ul>
        <div ref={menuRef} style={{ display:'flex', gap:10, alignItems:'center' }}>
          <LanguageSwitcher />
          <button onClick={() => navigate('/login')} style={{ padding:'7px 18px', border:'1.5px solid #002060', borderRadius:8, background:'transparent', color:'#002060', fontSize:13, fontWeight:700, cursor:'pointer' }}>{t('btn_signin')}</button>
          <button onClick={openRegister} style={{ padding:'7px 18px', border:'none', borderRadius:8, background:'#002060', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer' }}>{t('btn_register')}</button>
        </div>
      </nav>

      {/* ── NEWS TICKER ── */}
      <div style={{ background:'#002060', height:36, display:'flex', alignItems:'center', overflow:'hidden', position:'relative' }}>
        <div style={{ background:'#1A56C4', color:'#fff', fontSize:11, fontWeight:700, padding:'0 16px', height:'100%', display:'flex', alignItems:'center', letterSpacing:0.5, flexShrink:0 }}>LIVE UPDATES</div>
        <div style={{ flex:1, overflow:'hidden', position:'relative' }}>
          <div key={tickIdx} style={{ color:'rgba(255,255,255,.85)', fontSize:12.5, paddingLeft:24, animation:'slideIn .5s ease' }}>
            {TICKER_ITEMS[tickIdx]}
          </div>
        </div>
        <div style={{ paddingRight:20, display:'flex', gap:6 }}>
          {TICKER_ITEMS.map((_,i) => (
            <div key={i} onClick={() => setTickIdx(i)} style={{ width:6, height:6, borderRadius:'50%', background:i===tickIdx?'#60A5FA':'rgba(255,255,255,.25)', cursor:'pointer', transition:'background .3s' }} />
          ))}
        </div>
      </div>
      <style>{`@keyframes slideIn{from{transform:translateY(14px);opacity:0}to{transform:none;opacity:1}}`}</style>

      {/* ── HERO ── */}
      <div style={{ background:'linear-gradient(135deg,#001228 0%,#002060 55%,#0a3a8c 100%)', padding:'90px 40px 80px', textAlign:'center', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-120, left:-120, width:600, height:600, borderRadius:'50%', background:'rgba(26,86,196,.12)' }} />
        <div style={{ position:'absolute', bottom:-100, right:-80, width:500, height:500, borderRadius:'50%', background:'rgba(124,58,237,.08)' }} />
        <div style={{ position:'absolute', top:'30%', left:'5%', width:300, height:300, borderRadius:'50%', background:'rgba(96,165,250,.05)' }} />
        <div style={{ position:'relative', zIndex:1 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(255,255,255,.08)', border:'1px solid rgba(255,255,255,.18)', borderRadius:24, padding:'6px 18px', fontSize:11, color:'rgba(255,255,255,.8)', letterSpacing:0.6, textTransform:'uppercase', marginBottom:28 }}>
            <span style={{ width:7, height:7, background:'#4ADE80', borderRadius:'50%', display:'inline-block', animation:'pulse 2s infinite' }} />
            {t('hero_badge')}
          </div>
          <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
          <h1 style={{ fontSize:50, fontWeight:900, color:'#fff', lineHeight:1.12, marginBottom:18, letterSpacing:-1.5 }}>
            {t('hero_title')}
          </h1>
          <p style={{ fontSize:16, color:'rgba(255,255,255,.6)', maxWidth:560, margin:'0 auto 36px', lineHeight:1.85 }}>
            {t('hero_subtitle')}
          </p>
          <div style={{ display:'flex', justifyContent:'center', gap:14, flexWrap:'wrap', marginBottom:64 }}>
            <button onClick={openRegister} style={{ padding:'14px 34px', background:'#fff', border:'none', borderRadius:12, color:'#002060', fontSize:15, fontWeight:800, cursor:'pointer', boxShadow:'0 4px 24px rgba(0,0,0,.25)' }}>
              {t('hero_cta_candidate')} →
            </button>
            <button onClick={() => navigate('/login')} style={{ padding:'14px 34px', background:'rgba(255,255,255,.1)', border:'1.5px solid rgba(255,255,255,.28)', borderRadius:12, color:'#fff', fontSize:15, fontWeight:600, cursor:'pointer' }}>
              {t('btn_signin')}
            </button>
          </div>
          {/* Stats bar */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', maxWidth:860, margin:'0 auto', border:'1px solid rgba(255,255,255,.12)', borderRadius:16, overflow:'hidden', background:'rgba(255,255,255,.05)', backdropFilter:'blur(8px)' }}>
            {[['1.24L+','Learners trained','#60A5FA'],['2,340','Training partners','#34D399'],['67%','Placement rate','#FBBF24'],['28','States covered','#F472B6']].map(([n,l,c],i) => (
              <div key={l} style={{ padding:'22px 16px', textAlign:'center', borderRight:i<3?'1px solid rgba(255,255,255,.08)':'none' }}>
                <div style={{ fontSize:30, fontWeight:900, color:c, letterSpacing:-1, lineHeight:1 }}>{n}</div>
                <div style={{ fontSize:11.5, color:'rgba(255,255,255,.45)', marginTop:5, fontWeight:500 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── TRUST BAR ── */}
      <div style={{ background:'#f8fafc', borderBottom:'1px solid #e0e8f4', padding:'20px 40px', display:'flex', alignItems:'center', gap:32, justifyContent:'center', flexWrap:'wrap' }}>
        <span style={{ fontSize:12, color:'#94a3b8', fontWeight:600, letterSpacing:0.5 }}>{t('trust_recognised')}</span>
        {['Ministry of Skill Development & Entrepreneurship','NSDC','ASCI','National Career Service'].map(p => (
          <span key={p} style={{ fontSize:12.5, fontWeight:700, color:'#5a6a8a', padding:'6px 16px', borderRadius:6, border:'1px solid #e0e8f4', background:'#fff' }}>{p}</span>
        ))}
      </div>

      {/* ── PORTALS ── */}
      <section id="portals" style={sec}>
        {pill(t('section_portals'))}
        {h2(t('portals_h2'))}
        {sub(t('portals_sub'))}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:18 }}>
          {PORTALS.map(p => (
            <div key={p.tKey} onClick={() => navigate('/login' + (p.loginRole ? '?role='+p.loginRole : ''))}
              style={{ border:`1px solid #e8eef7`, borderTop:`3px solid ${p.border}`, borderRadius:16, padding:'24px 20px', cursor:'pointer', background:'#fff', transition:'all .22s', boxShadow:'0 1px 4px rgba(0,0,0,.04)' }}
              onMouseEnter={e => { e.currentTarget.style.transform='translateY(-5px)'; e.currentTarget.style.boxShadow='0 16px 40px rgba(0,32,96,.11)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='0 1px 4px rgba(0,0,0,.04)'; }}>
              <div style={{ width:48, height:48, borderRadius:12, background:p.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, marginBottom:16 }}>{p.icon}</div>
              <div style={{ fontSize:14.5, fontWeight:800, color:'#001845', marginBottom:6 }}>{t(p.tKey)}</div>
              <div style={{ fontSize:12.5, color:'#5a6a8a', lineHeight:1.7, marginBottom:14 }}>{p.desc}</div>
              <div style={{ fontSize:12.5, fontWeight:700, color:p.color }}>{t('btn_enter_portal')}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── IMPACT STRIP ── */}
      <div style={{ background:'linear-gradient(90deg,#001845 0%,#0a3a8c 100%)', padding:'50px 40px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:0, maxWidth:1100, margin:'0 auto' }}>
          {[
            ['1.24L+','impact_learners'],
            ['2,340','impact_centres'],
            ['67%','impact_placement'],
            ['28','impact_states'],
            ['₹480Cr','impact_csr'],
            ['13','impact_languages'],
          ].map(([n,l],i) => (
            <div key={l} style={{ textAlign:'center', padding:'12px 8px', borderRight:i<5?'1px solid rgba(255,255,255,.1)':'none' }}>
              <div style={{ fontSize:28, fontWeight:900, color:'#60A5FA', letterSpacing:-0.5 }}>{n}</div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,.45)', marginTop:4, fontWeight:500 }}>{t(l)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── SCHEMES ── */}
      <section id="schemes" style={{ ...sec, background:'#F8FAFF' }}>
        <div style={{ textAlign:'center' }}>
          {pill(t('section_schemes'))}
          {h2(t('schemes_h2'))}
          {sub(t('schemes_sub'))}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:22 }}>
          {SCHEMES.map(s => (
            <div key={s.name} style={{ background:'#fff', borderRadius:16, padding:'28px 24px', border:'1px solid #e0e8f4', boxShadow:'0 2px 8px rgba(0,0,0,.04)', transition:'box-shadow .2s' }}
              onMouseEnter={e => e.currentTarget.style.boxShadow='0 8px 28px rgba(0,32,96,.1)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow='0 2px 8px rgba(0,0,0,.04)'}>
              <div style={{ width:52, height:52, borderRadius:14, background:s.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, marginBottom:18 }}>{s.icon}</div>
              <div style={{ fontSize:16, fontWeight:800, color:'#001845', marginBottom:8 }}>{s.name}</div>
              <div style={{ fontSize:12.5, color:'#5a6a8a', lineHeight:1.75, marginBottom:16 }}>{s.desc}</div>
              <div style={{ display:'flex', alignItems:'baseline', gap:6 }}>
                <span style={{ fontSize:26, fontWeight:900, color:s.color }}>{s.stat}</span>
                <span style={{ fontSize:11.5, color:'#94a3b8' }}>{s.statLbl}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── SECTORS ── */}
      <section id="sectors" style={sec}>
        {pill(t('section_sectors'))}
        {h2(t('sectors_h2'))}
        {sub(t('sectors_sub'))}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:14 }}>
          {SECTORS.map(s => (
            <div key={s.label} style={{ background:'#fff', border:'1px solid #e0e8f4', borderRadius:14, padding:'22px 16px', textAlign:'center', cursor:'pointer', transition:'all .2s' }}
              onMouseEnter={e => { e.currentTarget.style.background=s.bg; e.currentTarget.style.borderColor=s.color; e.currentTarget.style.transform='translateY(-3px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background='#fff'; e.currentTarget.style.borderColor='#e0e8f4'; e.currentTarget.style.transform='none'; }}>
              <div style={{ fontSize:28, marginBottom:10 }}>{s.icon}</div>
              <div style={{ fontSize:13, fontWeight:700, color:'#001845', marginBottom:4 }}>{s.label}</div>
              <div style={{ fontSize:11, color:s.color, fontWeight:600 }}>{s.count}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ ...sec, background:'#F8FAFF' }}>
        <div style={{ textAlign:'center' }}>
          {pill(t('how_pill'))}
          {h2(t('how_h2'))}
          {sub(t('how_sub'))}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:0, position:'relative', maxWidth:1000, margin:'0 auto' }}>
          <div style={{ position:'absolute', top:32, left:'12.5%', right:'12.5%', height:2, background:'linear-gradient(90deg,#1A56C4,#60A5FA)', zIndex:0, borderRadius:2 }} />
          {[
            { n:'1', icon:'👤', title:'Register & verify',    desc:'Create a profile with mobile OTP. Choose your role — candidate, employer, or training partner.' },
            { n:'2', icon:'📚', title:'Choose a course',      desc:'Browse thousands of government-approved courses across sectors and enrol at a centre near you.' },
            { n:'3', icon:'🏆', title:'Train & get certified',desc:'Complete training, sit the sector skill council assessment, and earn a verifiable certificate.' },
            { n:'4', icon:'🏢', title:'Get placed',           desc:'Apply to matched job openings, attend placement drives, and receive post-placement support.' },
          ].map(s => (
            <div key={s.n} style={{ textAlign:'center', padding:'0 20px', position:'relative', zIndex:1 }}>
              <div style={{ width:64, height:64, borderRadius:'50%', background:'#002060', border:'3px solid #60A5FA', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px', fontSize:26 }}>{s.icon}</div>
              <div style={{ fontSize:11, fontWeight:700, color:'#1A56C4', letterSpacing:0.5, textTransform:'uppercase', marginBottom:6 }}>{t('how_step')} {s.n}</div>
              <div style={{ fontSize:14.5, fontWeight:800, color:'#001845', marginBottom:8 }}>{s.title}</div>
              <div style={{ fontSize:12.5, color:'#5a6a8a', lineHeight:1.75 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="about" style={{ ...sec, background:'#001845' }}>
        <div style={{ textAlign:'center' }}>
          {pill(t('features_pill'), true)}
          {h2(t('features_h2'), true)}
          {sub(t('features_sub'), true)}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:24 }}>
          {FEATURES.map(f => (
            <div key={f.title} style={{ background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.09)', borderRadius:16, padding:'28px 24px', transition:'background .2s' }}
              onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,.09)'}
              onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,.05)'}>
              <div style={{ width:52, height:52, borderRadius:14, background:'rgba(255,255,255,.08)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, marginBottom:18 }}>{f.icon}</div>
              <div style={{ fontSize:15, fontWeight:800, color:'#fff', marginBottom:8 }}>{f.title}</div>
              <div style={{ fontSize:12.5, color:'rgba(255,255,255,.45)', lineHeight:1.8 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PARTNERS ── */}
      <section id="partners" style={sec}>
        {pill(t('section_partners'))}
        {h2(t('partners_h2'))}
        {sub(t('partners_sub'))}
        <div style={{ display:'flex', flexWrap:'wrap', gap:10, justifyContent:'center' }}>
          {PARTNERS.map(p => (
            <div key={p} style={{ background:'#F8FAFF', border:'1px solid #e0e8f4', borderRadius:24, padding:'9px 22px', fontSize:12.5, fontWeight:600, color:'#002060', transition:'all .2s', cursor:'default' }}
              onMouseEnter={e => { e.currentTarget.style.background='#EFF6FF'; e.currentTarget.style.borderColor='#93C5FD'; }}
              onMouseLeave={e => { e.currentTarget.style.background='#F8FAFF'; e.currentTarget.style.borderColor='#e0e8f4'; }}>
              {p}
            </div>
          ))}
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section style={{ ...sec, background:'#F8FAFF' }}>
        <div style={{ textAlign:'center' }}>
          {pill(t('section_stories'))}
          {h2(t('stories_h2'))}
          {sub(t('stories_sub'))}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:22 }}>
          {TESTIMONIALS.map(t => (
            <div key={t.name} style={{ background:'#fff', border:'1px solid #e0e8f4', borderRadius:16, padding:'28px 26px', boxShadow:'0 2px 8px rgba(0,0,0,.04)' }}>
              <Stars n={t.stars} />
              <div style={{ fontSize:14, color:'#374151', lineHeight:1.85, marginBottom:20, fontStyle:'italic' }}>"{t.quote}"</div>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:44, height:44, borderRadius:'50%', background:t.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, fontWeight:800, color:'#fff', flexShrink:0 }}>{t.initials}</div>
                <div>
                  <div style={{ fontSize:13.5, fontWeight:700, color:'#001845' }}>{t.name}</div>
                  <div style={{ fontSize:12, color:'#5a6a8a' }}>{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── NEWS ── */}
      <section id="news" style={sec}>
        {pill(t('section_news'))}
        {h2(t('news_h2'))}
        {sub(t('news_sub'))}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:22 }}>
          {NEWS.map(n => (
            <div key={n.title} style={{ background:'#fff', border:'1px solid #e0e8f4', borderRadius:16, overflow:'hidden', boxShadow:'0 2px 8px rgba(0,0,0,.04)', cursor:'pointer', transition:'box-shadow .2s' }}
              onMouseEnter={e => e.currentTarget.style.boxShadow='0 8px 28px rgba(0,32,96,.1)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow='0 2px 8px rgba(0,0,0,.04)'}>
              <div style={{ background:`linear-gradient(135deg,${n.bg},#fff)`, padding:'24px 22px 20px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                  <span style={{ fontSize:10.5, fontWeight:700, color:n.color, background:n.bg, border:`1px solid ${n.color}30`, padding:'3px 10px', borderRadius:12 }}>{n.tag}</span>
                  <span style={{ fontSize:11, color:'#94a3b8' }}>{n.date}</span>
                </div>
                <div style={{ fontSize:14.5, fontWeight:800, color:'#001845', lineHeight:1.4, marginBottom:10 }}>{n.title}</div>
              </div>
              <div style={{ padding:'14px 22px 22px' }}>
                <div style={{ fontSize:13, color:'#5a6a8a', lineHeight:1.75 }}>{n.desc}</div>
                <div style={{ fontSize:12.5, fontWeight:700, color:n.color, marginTop:14 }}>{t('btn_read_more')}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── APP DOWNLOAD BANNER ── */}
      <div style={{ background:'linear-gradient(135deg,#002060,#1A56C4)', margin:'0 40px 80px', borderRadius:24, padding:'52px 48px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:32, boxShadow:'0 20px 60px rgba(0,32,96,.2)' }}>
        <div>
          <div style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,.5)', letterSpacing:1, textTransform:'uppercase', marginBottom:10 }}>{t('app_pill')}</div>
          <h3 style={{ fontSize:28, fontWeight:900, color:'#fff', margin:'0 0 12px', letterSpacing:-0.5 }}>{t('app_h3')}</h3>
          <p style={{ fontSize:14, color:'rgba(255,255,255,.6)', maxWidth:480, lineHeight:1.8, margin:'0 0 28px' }}>{t('app_sub')}</p>
          <div style={{ display:'flex', gap:12 }}>
            {['📱 Google Play','🍎 App Store'].map(lbl => (
              <button key={lbl} style={{ padding:'12px 22px', background:'rgba(255,255,255,.12)', border:'1.5px solid rgba(255,255,255,.3)', borderRadius:10, color:'#fff', fontSize:13.5, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:8 }}
                onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,.2)'}
                onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,.12)'}>
                {lbl}
              </button>
            ))}
          </div>
        </div>
        <div style={{ textAlign:'center', flexShrink:0 }}>
          <div style={{ width:160, height:160, borderRadius:28, background:'rgba(255,255,255,.1)', border:'2px solid rgba(255,255,255,.2)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:10 }}>
            <div style={{ fontSize:52 }}>📲</div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,.5)', fontWeight:600 }}>{t('app_scan')}</div>
          </div>
        </div>
      </div>

      {/* ── FAQ ── */}
      <section id="faq" style={{ ...sec, paddingTop:0 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1.6fr', gap:60, alignItems:'start' }}>
          <div style={{ position:'sticky', top:80 }}>
            {pill(t('section_faq'))}
            {h2('Frequently asked questions')}
            <p style={{ fontSize:14, color:'#5a6a8a', lineHeight:1.8 }}>{t('faq_support_txt')}</p>
            <button onClick={() => document.querySelector('#contact')?.scrollIntoView({ behavior:'smooth' })} style={{ marginTop:20, padding:'12px 24px', background:'#002060', border:'none', borderRadius:10, color:'#fff', fontSize:13.5, fontWeight:700, cursor:'pointer' }}>
              {t('btn_contact_sup')}
            </button>
          </div>
          <div>
            {FAQS.map(f => <FaqItem key={f.q} q={f.q} a={f.a} />)}
          </div>
        </div>
      </section>

      {/* ── CTA BAND ── */}
      <div style={{ background:'linear-gradient(135deg,#001228,#0a3a8c)', padding:'80px 40px', textAlign:'center' }}>
        <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(255,255,255,.08)', border:'1px solid rgba(255,255,255,.15)', borderRadius:24, padding:'6px 18px', fontSize:11, color:'rgba(255,255,255,.7)', letterSpacing:0.6, textTransform:'uppercase', marginBottom:24 }}>
          {t('cta_pill')}
        </div>
        <h2 style={{ fontSize:38, fontWeight:900, color:'#fff', letterSpacing:-0.8, marginBottom:12 }}>{t('cta_h2')}</h2>
        <p style={{ fontSize:15, color:'rgba(255,255,255,.55)', marginBottom:36, lineHeight:1.8, maxWidth:520, margin:'0 auto 36px' }}>
          {t('cta_sub')}
        </p>
        <div style={{ display:'flex', justifyContent:'center', gap:14, flexWrap:'wrap' }}>
          <button onClick={openRegister} style={{ padding:'14px 34px', background:'#fff', border:'none', borderRadius:12, color:'#002060', fontSize:15, fontWeight:800, cursor:'pointer' }}>{t('btn_reg_candidate')}</button>
          <button onClick={() => navigate('/login')} style={{ padding:'14px 34px', background:'rgba(255,255,255,.1)', border:'1.5px solid rgba(255,255,255,.28)', borderRadius:12, color:'#fff', fontSize:15, fontWeight:600, cursor:'pointer' }}>{t('btn_signin_portal')}</button>
        </div>
      </div>

      {/* ── CONTACT ── */}
      <section id="contact" style={{ ...sec, background:'#f0f4f8' }}>
        <div style={{ textAlign:'center', marginBottom:52 }}>
          {pill(t('contact_pill'))}
          {h2(t('contact_h2'))}
          <p style={{ fontSize:14.5, color:'#5a6a8a', maxWidth:480, margin:'0 auto', lineHeight:1.8 }}>{t('contact_sub')}</p>
        </div>
        <div style={{ maxWidth:1060, margin:'0 auto', display:'grid', gridTemplateColumns:'1fr 1.6fr', gap:36, alignItems:'start' }}>
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {[
              { icon:'🏢', title:'Head Office', lines:['Skills n Jobs AI Technologies Pvt. Ltd.','Plot No. 91, LVS Arcade, Jayabheri Enclave','Hitech City, Hyderabad – 500084'] },
              { icon:'📞', title:'Phone',        lines:['0000000000','Mon – Sat, 9 AM – 6 PM IST'] },
              { icon:'✉️', title:'Email',        lines:['support@skillsnjobs.in','grievance@skillsnjobs.in'] },
              { icon:'🕐', title:'Working Hours',lines:['Monday – Saturday','9:00 AM to 6:00 PM IST'] },
            ].map(({ icon, title, lines }) => (
              <div key={title} style={{ background:'#fff', borderRadius:14, padding:'20px 24px', boxShadow:'0 1px 6px rgba(0,0,0,.07)', display:'flex', gap:16, alignItems:'flex-start' }}>
                <div style={{ width:42, height:42, borderRadius:10, background:'#EFF6FF', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>{icon}</div>
                <div>
                  <div style={{ fontWeight:800, fontSize:13.5, color:'#001845', marginBottom:6 }}>{title}</div>
                  {lines.map(l => <div key={l} style={{ fontSize:13, color:'#4b5563', lineHeight:1.7 }}>{l}</div>)}
                </div>
              </div>
            ))}
          </div>
          <ContactForm />
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer id="resources" style={{ background:'#060c18', padding:'60px 40px 28px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'2.2fr 1fr 1fr 1fr 1fr', gap:40, marginBottom:48 }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
              <div style={{ width:42, height:42, borderRadius:'50%', border:'2px solid rgba(255,255,255,.15)', background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', flexShrink:0 }}>
                <img src="/logo.png" alt="SkillsNJobs" style={{ height:32, width:32, objectFit:'contain' }} />
              </div>
              <div style={{ fontSize:15, fontWeight:800, color:'#fff' }}>SkillsNJobs</div>
            </div>
            <p style={{ fontSize:12.5, color:'rgba(255,255,255,.28)', lineHeight:1.85, maxWidth:240, marginBottom:20 }}>{t('footer_tagline')}</p>
            <div style={{ display:'flex', gap:10 }}>
              {['𝕏','in','f','▶'].map(s => (
                <div key={s} style={{ width:34, height:34, borderRadius:8, background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:13, color:'rgba(255,255,255,.5)', fontWeight:700 }}
                  onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,.15)'; e.currentTarget.style.color='#fff'; }}
                  onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,.07)'; e.currentTarget.style.color='rgba(255,255,255,.5)'; }}>
                  {s}
                </div>
              ))}
            </div>
          </div>
          {[
            { hKey:'footer_platform', links:['Candidate portal','Employer portal','Training vendor','Trainer portal','CSR portal','State govt portal'] },
            { hKey:'footer_schemes',  links:['PMKVY 4.0','DDU-GKY','NAPS','State schemes','Digital skills'] },
            { hKey:'footer_company',  links:['About us','Careers','Press','Blog','Sector Skill Councils'] },
            { hKey:'footer_legal',    links:['Privacy policy','Terms of use','Grievance portal','Refund policy','Cookie policy'] },
          ].map(col => (
            <div key={col.hKey}>
              <div style={{ fontSize:10, fontWeight:800, color:'rgba(255,255,255,.35)', letterSpacing:1, textTransform:'uppercase', marginBottom:16 }}>{t(col.hKey)}</div>
              <ul style={{ listStyle:'none', padding:0, margin:0 }}>
                {col.links.map(l => (
                  <li key={l} style={{ marginBottom:10 }}>
                    <a href="#" style={{ fontSize:12.5, color:'rgba(255,255,255,.28)', textDecoration:'none', transition:'color .15s' }}
                      onMouseEnter={e => e.target.style.color='rgba(255,255,255,.75)'}
                      onMouseLeave={e => e.target.style.color='rgba(255,255,255,.28)'}>{l}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div style={{ borderTop:'1px solid rgba(255,255,255,.06)', paddingTop:22, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
          <p style={{ fontSize:11.5, color:'rgba(255,255,255,.18)' }}>{t('footer_rights')}</p>
          <div style={{ display:'flex', gap:16 }}>
            {['Privacy','Terms','Cookies'].map(l => (
              <a key={l} href="#" style={{ fontSize:11.5, color:'rgba(255,255,255,.18)', textDecoration:'none' }}
                onMouseEnter={e => e.target.style.color='rgba(255,255,255,.5)'}
                onMouseLeave={e => e.target.style.color='rgba(255,255,255,.18)'}>{l}</a>
            ))}
          </div>
        </div>
      </footer>

      {/* ── REGISTER MODAL ── */}
      {showRegister && (
        <div onClick={closeRegister} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.6)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(6px)' }}>
          <div onClick={e => e.stopPropagation()} style={{ background:'#fff', borderRadius:22, padding:'38px 34px', width:regStep==='role'?500:440, boxShadow:'0 40px 100px rgba(0,0,0,.45)', position:'relative', maxHeight:'90vh', overflowY:'auto' }}>
            <button onClick={closeRegister} style={{ position:'absolute', top:16, right:18, background:'none', border:'none', fontSize:24, color:'#94A3B8', cursor:'pointer', lineHeight:1 }}>×</button>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:24 }}>
              <img src="/logo.png" alt="SkillsNJobs" style={{ height:46, width:46, objectFit:'contain' }} />
              <div>
                <div style={{ fontSize:19, fontWeight:800, color:'#002060' }}>SkillsNJobs</div>
                <div style={{ fontSize:10.5, color:'#8899BB' }}>{regStep==='role'?'Choose your role to get started':`Registering as ${ROLES.find(r=>r.value===regRole)?.label}`}</div>
              </div>
            </div>
            {regStep==='role' && (
              <div>
                <p style={{ fontSize:13.5, color:'#64748B', marginBottom:18 }}>Select the role that best describes you:</p>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  {ROLES.map(r => (
                    <div key={r.value} onClick={() => selectRole(r.value)}
                      style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px', border:'1.5px solid #E2E8F0', borderRadius:12, cursor:'pointer', transition:'all .15s' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor='#1A56C4'; e.currentTarget.style.background='#F0F4FF'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor='#E2E8F0'; e.currentTarget.style.background='#fff'; }}>
                      <span style={{ fontSize:24 }}>{r.icon}</span>
                      <div><div style={{ fontSize:13.5, fontWeight:700, color:'#002060' }}>{r.label}</div><div style={{ fontSize:11, color:'#94A3B8' }}>{r.desc}</div></div>
                    </div>
                  ))}
                </div>
                <div style={{ textAlign:'center', marginTop:20, fontSize:13, color:'#64748B' }}>
                  Already have an account?{' '}<span onClick={() => { closeRegister(); navigate('/login'); }} style={{ color:'#1A56C4', fontWeight:700, cursor:'pointer' }}>Sign in</span>
                </div>
              </div>
            )}
            {regStep==='form' && (() => {
              const role = ROLES.find(r => r.value===regRole);
              const needsOrg = ['training_vendor','csr_org','placement_agency','employer'].includes(regRole);
              const orgLabel = regRole==='employer'?'Company Name':'Organisation Name';
              return (
                <div>
                  <button onClick={() => setRegStep('role')} style={{ background:'none', border:'none', color:'#1A56C4', fontSize:13, fontWeight:600, cursor:'pointer', padding:0, marginBottom:16 }}>← Back</button>
                  {regError && <div style={{ background:'#FEE2E2', border:'1px solid #FECACA', borderRadius:8, padding:'10px 14px', color:'#B91C1C', fontSize:13, marginBottom:16 }}>{regError}</div>}
                  <form onSubmit={handleRegister}>
                    {[
                      { label:'Full Name', type:'text', val:regName, set:setRegName, ph:'Your full name', required:true },
                      ...(needsOrg?[{ label:orgLabel, type:'text', val:regOrg, set:setRegOrg, ph:`Enter ${orgLabel.toLowerCase()}`, required:true }]:[]),
                      { label:'Email', type:'email', val:regEmail, set:setRegEmail, ph:'your@email.com', required:true },
                      { label:'Password', type:'password', val:regPassword, set:setRegPassword, ph:'Min. 8 characters', required:true },
                    ].map(f => (
                      <div key={f.label} style={{ marginBottom:14 }}>
                        <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#64748B', letterSpacing:0.5, textTransform:'uppercase', marginBottom:6 }}>{f.label}</label>
                        <input type={f.type} required={f.required} value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph}
                          style={{ width:'100%', padding:'11px 14px', border:'1.5px solid #E2E8F0', borderRadius:9, fontSize:14, outline:'none', boxSizing:'border-box' }}
                          onFocus={e => e.target.style.borderColor='#1A56C4'} onBlur={e => e.target.style.borderColor='#E2E8F0'} />
                      </div>
                    ))}
                    <button type="submit" disabled={registering} style={{ width:'100%', padding:'13px', background:'#002060', border:'none', borderRadius:10, color:'#fff', fontSize:15, fontWeight:700, cursor:registering?'not-allowed':'pointer', marginTop:8, opacity:registering?.7:1 }}>
                      {registering?'Creating account…':`Create ${role?.label} Account →`}
                    </button>
                  </form>
                  <div style={{ textAlign:'center', marginTop:20, fontSize:13, color:'#64748B' }}>
                    Already have an account?{' '}<span onClick={() => { closeRegister(); navigate('/login'); }} style={{ color:'#1A56C4', fontWeight:700, cursor:'pointer' }}>Sign in</span>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ── AI Chatbot floating widget ── */}
      <div style={{ position:'fixed', bottom:24, right:24, zIndex:10001, display:'flex', flexDirection:'column', alignItems:'flex-end' }}>
        {chatOpen && (
          <div style={{ width:340, height:460, background:'#fff', borderRadius:16, boxShadow:'0 8px 40px rgba(0,0,0,0.18)', border:'1px solid #E0E6EF', display:'flex', flexDirection:'column', marginBottom:10, overflow:'hidden' }}>
            <div style={{ background:'#002060', padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg,#7B5CF6,#9B6FFF)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>🤖</div>
                <div>
                  <div style={{ color:'#fff', fontWeight:700, fontSize:13 }}>AI Assistant</div>
                  <div style={{ color:'rgba(255,255,255,0.5)', fontSize:10 }}>SkillsnJobs · Always here</div>
                </div>
              </div>
              <button onClick={() => setChatOpen(false)} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.6)', cursor:'pointer', fontSize:18, lineHeight:1 }}>✕</button>
            </div>
            <div style={{ flex:1, overflowY:'auto', padding:'12px 14px', display:'flex', flexDirection:'column', gap:10 }}>
              {chatMsgs.map((m, i) => (
                <div key={i} style={{ display:'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{ maxWidth:'82%', padding:'8px 12px', borderRadius: m.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                    background: m.role === 'user' ? '#002060' : '#F1F5F9',
                    color: m.role === 'user' ? '#fff' : '#1A2B4A', fontSize:12.5, lineHeight:1.6 }}>
                    {m.text}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div style={{ display:'flex', justifyContent:'flex-start' }}>
                  <div style={{ padding:'8px 14px', background:'#F1F5F9', borderRadius:'12px 12px 12px 2px', fontSize:12 }}>
                    <span style={{ display:'inline-flex', gap:3 }}>
                      {[0,1,2].map(i => <span key={i} style={{ width:5, height:5, borderRadius:'50%', background:'#94A3B8', display:'inline-block', animation:`bounce 1.2s ${i*0.2}s infinite` }} />)}
                    </span>
                  </div>
                </div>
              )}
            </div>
            <div style={{ padding:'6px 10px', display:'flex', gap:6, overflowX:'auto', borderTop:'1px solid #F1F5F9' }}>
              {['Find courses','Find jobs','PMKVY schemes','How to register'].map(s => (
                <button key={s} onClick={() => setChatInput(s)}
                  style={{ flexShrink:0, fontSize:10.5, padding:'4px 10px', borderRadius:20, border:'1px solid #E0E6EF', background:'#F8FAFC', color:'#3D5170', cursor:'pointer', whiteSpace:'nowrap' }}>
                  {s}
                </button>
              ))}
            </div>
            <div style={{ padding:'10px 12px', borderTop:'1px solid #E0E6EF', display:'flex', gap:8, alignItems:'center' }}>
              <input value={chatInput} onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendChatMessage()}
                placeholder="Ask anything…"
                style={{ flex:1, padding:'8px 12px', borderRadius:20, border:'1.5px solid #E0E6EF', fontSize:12.5, outline:'none', color:'#1A2B4A' }} />
              <button onClick={sendChatMessage} disabled={chatLoading || !chatInput.trim()}
                style={{ width:34, height:34, borderRadius:'50%', background:chatInput.trim() ? '#002060' : '#E0E6EF', border:'none', cursor:'pointer',
                  color:'#fff', fontSize:15, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'background 0.2s' }}>
                ➤
              </button>
            </div>
          </div>
        )}
        <button onClick={() => setChatOpen(o => !o)} style={{ width:52, height:52, borderRadius:'50%', background:'linear-gradient(135deg,#7B5CF6,#002060)', border:'none', cursor:'pointer', boxShadow:'0 4px 20px rgba(123,92,246,0.5)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, position:'relative' }}>
          {chatOpen ? '✕' : '🤖'}
          {!chatOpen && chatMsgs.filter(m => m.role === 'assistant').length > 1 && (
            <span style={{ position:'absolute', top:0, right:0, width:14, height:14, borderRadius:'50%', background:'#EF4444', border:'2px solid #fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:8, color:'#fff', fontWeight:700 }}>!</span>
          )}
        </button>
      </div>
      <style>{`@keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-5px)}}`}</style>
    </div>
  );
}
