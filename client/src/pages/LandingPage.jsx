import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const TICKER_ITEMS = [
  'PMKVY 4.0 enrolments open · Apply now',
  'DDU-GKY: Rural youth skilling programme · 50,000 seats available',
  'NAPS Apprenticeship scheme · Register your organisation today',
  'New batch: AI & Data Analytics short course · Starts Aug 2026',
  'CSR funding available for skilling initiatives · Know more',
];

const PORTALS = [
  { title: 'Candidate', desc: 'Browse courses, apply to jobs, track applications, and earn certifications.', icon: '🎓', color: '#16A34A', bg: '#DCFCE7', border: '#4ADE80', href: '/candidate-portal' },
  { title: 'Employer', desc: 'Post jobs, discover skilled candidates, and manage your hiring pipeline.', icon: '🏢', color: '#1D4ED8', bg: '#DBEAFE', border: '#60A5FA', href: '/employer-portal' },
  { title: 'Trainer', desc: 'Manage batches, track learner progress, and submit assessments digitally.', icon: '📋', color: '#BE185D', bg: '#FCE7F3', border: '#F472B6', href: '/trainer-portal' },
  { title: 'Training Vendor', desc: 'Register your organisation, manage training centres, and get government tie-ups.', icon: '🏫', color: '#D97706', bg: '#FEF3C7', border: '#FBBF24', href: '/vendor-portal' },
  { title: 'CSR Organisation', desc: 'Channel CSR funds into verified skilling projects and track social impact.', icon: '🤝', color: '#7C3AED', bg: '#EDE9FE', border: '#A78BFA', href: '/csr-portal' },
  { title: 'Placement Partner', desc: 'Connect trained candidates to employers and track placement outcomes.', icon: '🔗', color: '#EA580C', bg: '#FFEDD5', border: '#FB923C', href: '/placement-partner-portal' },
  { title: 'State Government', desc: 'Monitor scheme targets, disburse funds, and access district-level MIS reports.', icon: '🏛️', color: '#059669', bg: '#D1FAE5', border: '#34D399', href: '/state-govt-portal' },
  { title: 'Administrator', desc: 'Platform-wide oversight, user management, audit logs, and analytics.', icon: '🛡️', color: '#475569', bg: '#F1F5F9', border: '#94A3B8', href: '/dashboard' },
];

const SCHEMES = [
  { name: 'PMKVY 4.0', icon: '🏅', bg: '#EFF6FF', color: '#1D4ED8', desc: 'Pradhan Mantri Kaushal Vikas Yojana — free short-term skill training with certification and placement support for Indian youth.', stat: '8,800+', statLbl: 'Training centres registered' },
  { name: 'DDU-GKY', icon: '🌾', bg: '#F0FDF4', color: '#16A34A', desc: 'Deen Dayal Upadhyaya Grameen Kaushalya Yojana — skilling and placement programme focused on rural youth from BPL families.', stat: '2.4L+', statLbl: 'Rural youth trained' },
  { name: 'NAPS', icon: '💼', bg: '#FFF7ED', color: '#EA580C', desc: 'National Apprenticeship Promotion Scheme — government shares 25% of stipend costs with employers who hire apprentices.', stat: '1.1L', statLbl: 'Active apprentices' },
  { name: 'State Schemes', icon: '🗺️', bg: '#FAF5FF', color: '#7C3AED', desc: 'Access state-specific skilling initiatives and scholarships. Integrated with 28 state portals for seamless disbursement.', stat: '28', statLbl: 'States integrated' },
  { name: 'Digital Skills', icon: '💻', bg: '#FFF1F2', color: '#BE123C', desc: 'Future-ready digital literacy and tech courses — AI, data analytics, coding, cloud computing, and cybersecurity.', stat: '340+', statLbl: 'Digital courses available' },
  { name: 'CSR Skilling', icon: '💚', bg: '#ECFDF5', color: '#059669', desc: 'Corporations can fund and track skilling projects through a transparent CSR portal aligned with Schedule VII of Companies Act.', stat: '₹480Cr', statLbl: 'CSR funds channelled' },
];

const FEATURES = [
  { icon: '🌐', title: 'Multilingual support', desc: 'Available in 13 Indian languages. Candidates can access courses, certificates, and job listings in their native language.', color: '#60A5FA' },
  { icon: '📊', title: 'Real-time MIS dashboards', desc: 'Live district, state, and national dashboards for government officials. Track targets, disbursements, and placements instantly.', color: '#34D399' },
  { icon: '📜', title: 'Digital certificates', desc: 'Blockchain-anchored, verifiable skill certificates. Employers can authenticate certificates instantly via a QR code.', color: '#FBBF24' },
  { icon: '🤖', title: 'AI-based job matching', desc: 'Smart matching engine scores candidate-job compatibility based on skills, location, experience, and sector alignment.', color: '#F472B6' },
  { icon: '🔒', title: 'Secure & auditable', desc: 'End-to-end audit logs, role-based access control, and data isolation per state — built with OWASP Top 10 standards.', color: '#A78BFA' },
  { icon: '📱', title: 'Mobile-first design', desc: 'Fully responsive, works on low-bandwidth networks. Offline mode available for training attendance and assessments.', color: '#FB923C' },
];

const TESTIMONIALS = [
  { quote: '"I completed the PMKVY logistics course and got placed at Amazon within 3 weeks. SkillsNJobs made the entire process seamless — from enrolment to offer letter."', name: 'Aisha Khan', role: 'Warehouse Associate, Nagpur', initials: 'AK', color: '#16A34A' },
  { quote: '"The AI-matched candidate profiles save us weeks of screening. 80% of our warehouse hires in 2025 came through SkillsNJobs and they\'re better prepared than ever."', name: 'HR Manager, TechNova', role: 'Employer, Pune', initials: 'HR', color: '#1D4ED8' },
  { quote: '"Managing DDU-GKY batches across 14 districts is now effortless. The MIS dashboard gives our team real-time visibility we never had before with spreadsheets."', name: 'State Administrator', role: 'Government of Rajasthan', initials: 'SA', color: '#7C3AED' },
];

const PARTNERS = ['NSDC','Ministry of Skill Development','ASCI','IT-ITeS SSC','BFSI SSC','Healthcare SSC','Logistics SSC','Retail SSC','TCS iON','Wipro','Infosys BPM','Amazon India','Flipkart','HDFC Bank','Apollo Hospitals','Maruti Suzuki'];

export default function LandingPage() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [tickerOffset, setTickerOffset] = useState(0);
  const menuRef = useRef(null);
  const tickerRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handler(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", color: '#1a1a2e', background: '#fff', fontSize: 14, lineHeight: 1.6, overflowX: 'hidden' }}>

      {/* ── NAVBAR ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(10px)',
        borderBottom: '1px solid #e0e8f4', padding: '0 40px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60,
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <img src="/logo.png" alt="Skills n Jobs" style={{ height: 48, width: 48, objectFit: 'contain' }} />
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#002060', letterSpacing: -0.3 }}>SkillsNJobs</div>
            <div style={{ fontSize: 9, color: '#5a6a8a', letterSpacing: 0.5, textTransform: 'uppercase', marginTop: -2 }}>Skill India · National Skills Mission</div>
          </div>
        </div>

        {/* Nav links */}
        <ul style={{ display: 'flex', gap: 28, listStyle: 'none', margin: 0, padding: 0 }}>
          {['About', 'Schemes', 'Training Partners', 'Employers', 'Resources'].map(l => (
            <li key={l}><a href="#" style={{ fontSize: 13, color: '#5a6a8a', textDecoration: 'none', fontWeight: 500 }}>{l}</a></li>
          ))}
        </ul>

        {/* Auth dropdown */}
        <div style={{ position: 'relative' }} ref={menuRef}>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => navigate('/login')}
              style={{ padding: '7px 18px', border: '1.5px solid #002060', borderRadius: 8, background: 'transparent', color: '#002060', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
            >
              Login
            </button>
            <button
              onClick={() => setMenuOpen(o => !o)}
              style={{ padding: '7px 18px', border: 'none', borderRadius: 8, background: '#002060', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              Register
              <span style={{ fontSize: 10, transform: menuOpen ? 'rotate(180deg)' : 'rotate(0)', transition: '0.2s', display: 'inline-block' }}>▼</span>
            </button>
          </div>

          {/* Dropdown */}
          {menuOpen && (
            <div style={{
              position: 'absolute', right: 0, top: 'calc(100% + 8px)', background: '#fff',
              border: '1px solid #e0e8f4', borderRadius: 12, width: 240,
              boxShadow: '0 12px 40px rgba(0,32,96,0.13)', zIndex: 200, overflow: 'hidden',
            }}>
              <div style={{ padding: '10px 16px 6px', fontSize: 10, fontWeight: 700, color: '#5a6a8a', letterSpacing: 0.8, textTransform: 'uppercase' }}>Register as</div>
              {[
                { label: 'Candidate', icon: '🎓', desc: 'Find courses & jobs' },
                { label: 'Employer', icon: '🏢', desc: 'Hire skilled talent' },
                { label: 'Trainer', icon: '📋', desc: 'Manage your batches' },
                { label: 'Training Vendor', icon: '🏫', desc: 'List your organisation' },
                { label: 'CSR Organisation', icon: '🤝', desc: 'Fund skilling projects' },
                { label: 'Placement Partner', icon: '🔗', desc: 'Drive placements' },
              ].map(item => (
                <div
                  key={item.label}
                  onClick={() => { setMenuOpen(false); navigate('/register'); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', cursor: 'pointer', transition: 'background .15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#F0F4FF'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ fontSize: 20, width: 32, textAlign: 'center' }}>{item.icon}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#002060' }}>{item.label}</div>
                    <div style={{ fontSize: 11, color: '#5a6a8a' }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* ── HERO ── */}
      <div style={{ background: 'linear-gradient(135deg,#001845 0%,#002060 50%,#0a3a8c 100%)', padding: '80px 40px 70px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -100, left: -100, width: 500, height: 500, borderRadius: '50%', background: 'rgba(26,86,196,0.15)' }} />
        <div style={{ position: 'absolute', bottom: -80, right: -80, width: 400, height: 400, borderRadius: '50%', background: 'rgba(124,58,237,0.1)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 20, padding: '5px 16px', fontSize: 11, color: 'rgba(255,255,255,0.8)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 24 }}>
            <span style={{ width: 6, height: 6, background: '#4ADE80', borderRadius: '50%', display: 'inline-block' }} />
            National Skills Mission · Skill India
          </div>
          <h1 style={{ fontSize: 44, fontWeight: 800, color: '#fff', lineHeight: 1.15, marginBottom: 16, letterSpacing: -1 }}>
            From <span style={{ color: '#60A5FA' }}>skill</span> to <span style={{ color: '#60A5FA' }}>career</span> —<br />one unified platform
          </h1>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.65)', maxWidth: 540, margin: '0 auto 32px', lineHeight: 1.8 }}>
            SkillsNJobs connects learners, trainers, employers, and government — bridging the gap between vocational education and meaningful employment across India.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 56 }}>
            <button onClick={() => navigate('/register')} style={{ padding: '13px 30px', background: '#fff', border: 'none', borderRadius: 10, color: '#002060', fontSize: 14, fontWeight: 800, cursor: 'pointer' }}>
              Start learning for free →
            </button>
            <button onClick={() => navigate('/login')} style={{ padding: '13px 30px', background: 'rgba(255,255,255,0.1)', border: '1.5px solid rgba(255,255,255,0.3)', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              Sign in to your portal
            </button>
          </div>
          {/* Stats strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', maxWidth: 800, margin: '0 auto', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 14, overflow: 'hidden', background: 'rgba(255,255,255,0.06)' }}>
            {[['1.24L+','Learners trained'],['2,340','Training partners'],['67%','Placement rate'],['28','States covered']].map(([n,l], i) => (
              <div key={l} style={{ padding: '18px 16px', textAlign: 'center', borderRight: i < 3 ? '1px solid rgba(255,255,255,0.1)' : 'none' }}>
                <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: -0.5 }}>{n}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── TICKER ── */}
      <div style={{ background: '#F4A900', padding: '9px 0', overflow: 'hidden', whiteSpace: 'nowrap' }}>
        <div style={{ display: 'inline-flex', animation: 'landingTick 30s linear infinite' }}>
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((t, i) => (
            <span key={i} style={{ fontSize: 12, fontWeight: 600, color: '#1a1000', padding: '0 32px', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 4, height: 4, background: 'rgba(0,0,0,0.3)', borderRadius: '50%', display: 'inline-block', flexShrink: 0 }} />
              {t}
            </span>
          ))}
        </div>
        <style>{`@keyframes landingTick{from{transform:translateX(0)}to{transform:translateX(-50%)}}`}</style>
      </div>

      {/* ── PORTALS ── */}
      <section style={{ padding: '70px 40px' }}>
        <div style={{ marginBottom: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: '#1A56C4', background: '#F0F4FF', borderRadius: 20, padding: '4px 14px' }}>Choose your portal</span>
        </div>
        <h2 style={{ fontSize: 30, fontWeight: 800, color: '#002060', letterSpacing: -0.5, marginBottom: 6 }}>One platform, every stakeholder</h2>
        <p style={{ fontSize: 14, color: '#5a6a8a', maxWidth: 520, lineHeight: 1.7, marginBottom: 36 }}>Whether you're a learner, employer, trainer, or government body — SkillsNJobs has a dedicated workspace for you.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
          {PORTALS.map(p => (
            <div
              key={p.title}
              onClick={() => navigate('/login')}
              style={{ border: `1px solid #e0e8f4`, borderTop: `3px solid ${p.border}`, borderRadius: 14, padding: '22px 18px', cursor: 'pointer', background: '#fff', transition: 'transform .2s,box-shadow .2s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,32,96,0.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div style={{ width: 44, height: 44, borderRadius: 11, background: p.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 14 }}>{p.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#002060', marginBottom: 4 }}>{p.title}</div>
              <div style={{ fontSize: 12, color: '#5a6a8a', lineHeight: 1.6, marginBottom: 12 }}>{p.desc}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: p.color, display: 'flex', alignItems: 'center', gap: 4 }}>Enter portal →</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── SCHEMES ── */}
      <section style={{ padding: '70px 40px', background: '#F0F4FF' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: '#1A56C4', background: '#fff', borderRadius: 20, padding: '4px 14px' }}>Government schemes</span>
          <h2 style={{ fontSize: 30, fontWeight: 800, color: '#002060', letterSpacing: -0.5, margin: '12px 0 6px' }}>Aligned with National Skill Development</h2>
          <p style={{ fontSize: 14, color: '#5a6a8a', maxWidth: 520, margin: '0 auto', lineHeight: 1.7 }}>SkillsNJobs is fully integrated with major government skilling schemes. Apply directly through the platform.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
          {SCHEMES.map(s => (
            <div key={s.name} style={{ background: '#fff', borderRadius: 14, padding: '26px 22px', border: '1px solid #e0e8f4' }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginBottom: 16 }}>{s.icon}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#002060', marginBottom: 6 }}>{s.name}</div>
              <div style={{ fontSize: 12, color: '#5a6a8a', lineHeight: 1.7, marginBottom: 14 }}>{s.desc}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.stat}</div>
              <div style={{ fontSize: 11, color: '#5a6a8a' }}>{s.statLbl}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding: '70px 40px' }}>
        <div style={{ textAlign: 'center', marginBottom: 50 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: '#1A56C4', background: '#F0F4FF', borderRadius: 20, padding: '4px 14px' }}>How it works</span>
          <h2 style={{ fontSize: 30, fontWeight: 800, color: '#002060', letterSpacing: -0.5, margin: '12px 0 6px' }}>Skill to career in 4 steps</h2>
          <p style={{ fontSize: 14, color: '#5a6a8a', maxWidth: 480, margin: '0 auto', lineHeight: 1.7 }}>A clear, supported pathway from enrolment to employment — tracked end to end on one platform.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 0, position: 'relative' }}>
          <div style={{ position: 'absolute', top: 28, left: '12.5%', right: '12.5%', height: 1.5, background: '#e0e8f4', zIndex: 0 }} />
          {[
            { n: '1', title: 'Register & verify', desc: 'Create a profile with mobile OTP. Choose your role — candidate, employer, or training partner.' },
            { n: '2', title: 'Choose a course', desc: 'Browse thousands of government-approved courses across sectors and enrol at a centre near you.' },
            { n: '3', title: 'Train & get certified', desc: 'Complete your training, sit the sector skill council assessment, and earn a verifiable certificate.' },
            { n: '4', title: 'Get placed', desc: 'Apply to matched job openings, attend placement drives, and receive post-placement support.' },
          ].map(s => (
            <div key={s.n} style={{ textAlign: 'center', padding: '0 16px', position: 'relative', zIndex: 1 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#fff', border: '2px solid #1A56C4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 20, fontWeight: 800, color: '#1A56C4' }}>{s.n}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#002060', marginBottom: 6 }}>{s.title}</div>
              <div style={{ fontSize: 12, color: '#5a6a8a', lineHeight: 1.7 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ background: '#002060', padding: '70px 40px' }}>
        <div style={{ textAlign: 'center', marginBottom: 44 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.08)', borderRadius: 20, padding: '4px 14px' }}>Platform features</span>
          <h2 style={{ fontSize: 30, fontWeight: 800, color: '#fff', letterSpacing: -0.5, margin: '12px 0 6px' }}>Built for scale, built for India</h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', maxWidth: 480, margin: '0 auto', lineHeight: 1.7 }}>Designed to handle the complexity of national skilling — multilingual, accessible, and real-time.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }}>
          {FEATURES.map(f => (
            <div key={f.title} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: '26px 22px' }}>
              <div style={{ fontSize: 26, marginBottom: 14 }}>{f.icon}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 6 }}>{f.title}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PARTNERS ── */}
      <section style={{ padding: '70px 40px' }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: '#1A56C4', background: '#F0F4FF', borderRadius: 20, padding: '4px 14px' }}>Ecosystem</span>
          <h2 style={{ fontSize: 30, fontWeight: 800, color: '#002060', letterSpacing: -0.5, margin: '12px 0 6px' }}>Trusted by 1,200+ organisations</h2>
          <p style={{ fontSize: 14, color: '#5a6a8a', maxWidth: 480, margin: '0 auto', lineHeight: 1.7 }}>From sector skill councils to Fortune 500 employers — SkillsNJobs powers India's largest skilling ecosystem.</p>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
          {PARTNERS.map(p => (
            <div key={p} style={{ background: '#F0F4FF', border: '1px solid #e0e8f4', borderRadius: 20, padding: '8px 20px', fontSize: 12, fontWeight: 600, color: '#002060' }}>{p}</div>
          ))}
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section style={{ background: '#F0F4FF', padding: '70px 40px' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: '#1A56C4', background: '#fff', borderRadius: 20, padding: '4px 14px' }}>Stories</span>
          <h2 style={{ fontSize: 30, fontWeight: 800, color: '#002060', letterSpacing: -0.5, margin: '12px 0' }}>Real impact, real people</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
          {TESTIMONIALS.map(t => (
            <div key={t.name} style={{ background: '#fff', border: '1px solid #e0e8f4', borderRadius: 14, padding: '24px' }}>
              <div style={{ fontSize: 13, color: '#5a6a8a', lineHeight: 1.8, marginBottom: 16, fontStyle: 'italic' }}>{t.quote}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: t.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{t.initials}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#002060' }}>{t.name}</div>
                  <div style={{ fontSize: 11, color: '#5a6a8a' }}>{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA BAND ── */}
      <div style={{ background: 'linear-gradient(135deg,#001845,#0a3a8c)', padding: '70px 40px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 34, fontWeight: 800, color: '#fff', letterSpacing: -0.5, marginBottom: 10 }}>Ready to start your journey?</h2>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginBottom: 32 }}>Join over 1.24 lakh learners, 2,300 training partners, and 4,000 employers on one platform.</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
          <button onClick={() => navigate('/register')} style={{ padding: '13px 30px', background: '#fff', border: 'none', borderRadius: 10, color: '#002060', fontSize: 14, fontWeight: 800, cursor: 'pointer' }}>Register as a candidate</button>
          <button onClick={() => navigate('/login')} style={{ padding: '13px 30px', background: 'rgba(255,255,255,0.1)', border: '1.5px solid rgba(255,255,255,0.3)', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Sign in to portal →</button>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer style={{ background: '#0d0d1a', padding: '50px 40px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 40, marginBottom: 40 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <img src="/logo.png" alt="Skills n Jobs" style={{ height: 40, width: 40, objectFit: 'contain' }} />
              <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>SkillsNJobs</div>
            </div>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', lineHeight: 1.8, maxWidth: 240 }}>India's unified platform for skill development, vocational training, and employment. Aligned with National Skills Mission 2025–30.</p>
          </div>
          {[
            { h: 'Platform', links: ['Candidate portal','Employer portal','Training vendor','Trainer portal','CSR portal','State govt portal'] },
            { h: 'Schemes', links: ['PMKVY 4.0','DDU-GKY','NAPS','State schemes','Digital skills'] },
            { h: 'Resources', links: ['About us','Sector skill councils','MIS reports','Help centre','Grievance portal','Privacy policy'] },
          ].map(col => (
            <div key={col.h}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 14 }}>{col.h}</div>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {col.links.map(l => <li key={l} style={{ marginBottom: 8 }}><a href="#" style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>{l}</a></li>)}
              </ul>
            </div>
          ))}
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>© 2026 SkillsNJobs. Government of India initiative under National Skills Mission.</p>
          <div style={{ display: 'flex', gap: 8 }}>
            {['Skill India','Digital India','Make in India'].map(b => (
              <div key={b} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 4, padding: '3px 8px', fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>{b}</div>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
