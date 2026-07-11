import { useState, useEffect } from 'react';
import { validate as fieldValidate } from '../utils/validators.js';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api.js';
import { toISODate } from '../utils/date.js';

/* ─── Constants ─────────────────────────────────────────────── */
const STATES = ['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Andaman & Nicobar','Chandigarh','Delhi','Dadra & Nagar Haveli','Daman & Diu','Jammu & Kashmir','Ladakh','Lakshadweep','Puducherry'];
const ORG_TYPES = ['Private Limited Company','Public Limited Company','Limited Liability Partnership (LLP)','Partnership Firm','Sole Proprietorship','Society','Trust / NGO','Government Institution','Autonomous Body','Section 8 Company','Other'];
const NSDC_SECTORS = ['Agriculture','Apparel, Made-Ups & Home Furnishing','Automotive','Beauty & Wellness','BFSI','Capital Goods','Construction','Domestic Workers','Electronics & Hardware','Food Processing','Furniture & Fittings','Gems & Jewellery','Green Jobs','Handicrafts & Carpet','Healthcare','Infrastructure Equipment','IT / ITeS','Leather','Life Sciences','Logistics','Management & Entrepreneurship','Media & Entertainment','Mining','Paints & Coatings','Plumbing','Power','Retail','Rubber','Security','Sports, Physical Education & Fitness','Telecom','Textile','Tourism & Hospitality','Water Management'];
const AFFIL_TYPES = ['NSDC Direct Partner','SSC Affiliated Partner','State Government Partner','CSR / NGO Partner','PPP (Public Private Partnership)','Other'];
const DELIVERY = ['Classroom / Offline','Online / e-Learning','Blended (Online + Offline)','Mobile / On-site'];
const NSQF = ['Level 1','Level 2','Level 3','Level 4','Level 5','Level 6','Level 7','Level 8'];

const STEPS = [
  { id:1,  icon:'🏢', title:'Organisation Details',         sub:'Basic information about your organisation', dynamic:true },
  { id:2,  icon:'📋', title:'Contact Details',              sub:'SPOC and alternate contact' },
  { id:3,  icon:'📜', title:'Legal & Statutory',            sub:'PAN, TAN, GSTIN, MSME, Udyam' },
  { id:4,  icon:'🏅', title:'Accreditation & Affiliation',  sub:'NSDC partner code and SSC affiliation' },
  { id:5,  icon:'🎯', title:'Sectors & Job Roles',          sub:'NSDC sectors and NSQF-aligned roles' },
  { id:6,  icon:'🏗️', title:'Training Infrastructure',      sub:'Training centres, capacity, facilities' },
  { id:7,  icon:'👩‍🏫', title:'Faculty & Trainers',          sub:'Trainer count, qualifications, assessors' },
  { id:8,  icon:'📚', title:'Courses & Curriculum',         sub:'Programmes, NSQF level, delivery mode' },
  { id:9,  icon:'🏦', title:'Financial Details',            sub:'Bank account for disbursements' },
  { id:10, icon:'📁', title:'Document Upload',              sub:'Certificates and supporting documents' },
  { id:11, icon:'✅', title:'Declaration & Submit',         sub:'Review, confirm and complete registration' },
];

/* ─── Sub-components ─────────────────────────────────────────── */
function F({ label, required, hint, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#445074', marginBottom:5 }}>
        {label}{required && <span style={{ color:'#EF4444', marginLeft:2 }}>*</span>}
      </label>
      {children}
      {hint && <div style={{ fontSize:11, color:'#94A3B8', marginTop:3 }}>{hint}</div>}
    </div>
  );
}

function Inp({ id, value, onChange, onBlur, placeholder, type='text', maxLength, disabled, readOnly, style: extraStyle }) {
  return (
    <input id={id} type={type} value={value||''} onChange={onChange} onBlur={onBlur}
      placeholder={placeholder} maxLength={maxLength}
      disabled={disabled} readOnly={readOnly}
      style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #DDE3EE', borderRadius:9,
        fontSize:13, color:'#0A2D6E', background: disabled||readOnly ? '#F8FAFC' : '#fff', outline:'none',
        ...extraStyle }} />
  );
}

function Sel({ id, value, onChange, children }) {
  return (
    <select id={id} value={value||''} onChange={onChange}
      style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #DDE3EE', borderRadius:9,
        fontSize:13, color: value ? '#0A2D6E' : '#94A3B8', background:'#fff', outline:'none' }}>
      {children}
    </select>
  );
}

function G2({ children }) { return <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>{children}</div>; }
function G3({ children }) { return <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>{children}</div>; }

function SBox({ title, children }) {
  return (
    <div style={{ background:'#F8FAFC', border:'1px solid #E2E8F0', borderRadius:10, padding:'15px 17px', marginBottom:15 }}>
      <div style={{ fontSize:10, fontWeight:700, color:'#94A3B8', letterSpacing:.6, textTransform:'uppercase', marginBottom:12 }}>{title}</div>
      {children}
    </div>
  );
}

function Tag({ label, onRemove }) {
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4, background:'#EFF6FF', color:'#1D4ED8',
      border:'1px solid #BFDBFE', borderRadius:99, padding:'3px 11px', fontSize:12, fontWeight:600, margin:3 }}>
      {label}
      <button type="button" onClick={onRemove}
        style={{ background:'none', border:'none', cursor:'pointer', color:'#93C5FD', fontSize:15, lineHeight:1, padding:0 }}>×</button>
    </span>
  );
}

function AddBtn({ onClick, children }) {
  return (
    <button type="button" onClick={onClick}
      style={{ padding:'9px 16px', borderRadius:9, border:'1.5px dashed #93C5FD', background:'#EFF6FF',
        color:'#1D4ED8', fontSize:13, fontWeight:600, cursor:'pointer', width:'100%', marginTop:6 }}>
      {children}
    </button>
  );
}

function SubCard({ title, onRemove, children }) {
  return (
    <div style={{ background:'#F8FAFC', border:'1px solid #E2E8F0', borderRadius:10, padding:15, marginBottom:11 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:11 }}>
        <span style={{ fontSize:10.5, fontWeight:700, color:'#7886A6', textTransform:'uppercase', letterSpacing:.4 }}>{title}</span>
        {onRemove && (
          <button type="button" onClick={onRemove}
            style={{ padding:'4px 11px', borderRadius:7, border:'1px solid #FECACA', background:'#FEF2F2',
              color:'#B91C1C', fontSize:11, fontWeight:700, cursor:'pointer' }}>Remove</button>
        )}
      </div>
      {children}
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────── */
export default function TrainingPartnerOnboarding({ standalone = true, onDone }) {
  const { user, refresh, logout } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [orgClassifications, setOrgClassifications] = useState([]);

  useEffect(() => {
    api.orgClassifications().then(data => setOrgClassifications(data.filter(c => c.is_enabled))).catch(() => {});
  }, []);

  /* Step 1 */
  const [orgType, setOrgType]     = useState('');
  const [dateIncorp, setDateIncorp] = useState('');
  const [dateIncorpError, setDateIncorpError] = useState('');
  const [cinReg, setCinReg]       = useState('');
  const [cinRegError, setCinRegError] = useState('');
  const [website, setWebsite]     = useState('');
  const [websiteError, setWebsiteError] = useState('');
  const [headAddr, setHeadAddr]   = useState('');
  const [headAddrError, setHeadAddrError] = useState('');
  const [headState, setHeadState] = useState('');
  const [headDistrict, setHeadDistrict] = useState('');
  const [headCity, setHeadCity]   = useState('');
  const [headPin, setHeadPin]     = useState('');
  const [headPinError, setHeadPinError] = useState('');
  const [headPinLoading, setHeadPinLoading] = useState(false);

  /* Step 2 */
  const [spocName, setSpocName]   = useState(user?.first_name || '');
  const [spocDesig, setSpocDesig] = useState('');
  const [altName, setAltName]     = useState('');
  const [altMobile, setAltMobile] = useState('');
  const [altEmail, setAltEmail]   = useState('');
  const [altEmailError, setAltEmailError] = useState('');
  const [spocNameError, setSpocNameError] = useState('');
  const [altNameError,  setAltNameError]  = useState('');

  /* Step 3 */
  const [panNo, setPanNo]   = useState(user?.pan || '');
  const [panError, setPanError] = useState('');
  const [tanNo, setTanNo]   = useState('');
  const [tanError, setTanError] = useState('');
  const [gstNo, setGstNo]   = useState(user?.gstin || '');
  const [gstError, setGstError] = useState('');
  const [msme, setMsme]     = useState('');
  const [msmeError, setMsmeError] = useState('');
  const [udyam, setUdyam]       = useState('');
  const [udyamError, setUdyamError] = useState('');

  /* Step 4 */
  const [nsdcCode, setNsdcCode]     = useState('');
  const [affiliType, setAffilType]  = useState('');
  const [sscName, setSscName]       = useState('');
  const [sscAffId, setSscAffId]     = useState('');
  const [affFrom, setAffFrom]       = useState('');
  const [affTo, setAffTo]           = useState('');
  const [isoCert, setIsoCert]       = useState('');

  /* Step 5 */
  const [sectors, setSectors]       = useState([]);
  const [jobRoles, setJobRoles]     = useState([{ role:'', nsqf:'', ssc:'' }]);

  /* Step 6 */
  const [numCentres, setNumCentres] = useState('1');
  const [centres, setCentres]       = useState([{ name:'', addr:'', state:'', district:'', city:'', pin:'', area:'', cap:'', lab:'Yes', own:'Owned' }]);
  const [centreNameErrors, setCentreNameErrors] = useState(['']);

  /* Step 7 */
  const [ftTrainers, setFtTrainers]     = useState('');
  const [ptTrainers, setPtTrainers]     = useState('');
  const [trainerQual, setTrainerQual]   = useState('');
  const [numAssessors, setNumAssessors] = useState('');
  const [assessorCert, setAssessorCert] = useState('');
  const [totalStaff, setTotalStaff]     = useState('');

  /* Step 8 */
  const [courses, setCourses] = useState([{ name:'', dur:'', nsqf:'', cert:'', mode:'', batch:'' }]);

  /* Step 9 */
  const [bankName, setBankName]       = useState('');
  const [bankBranch, setBankBranch]   = useState('');
  const [bankIfsc, setBankIfsc]       = useState(user?.bank_ifsc || '');
  const [bankAccType, setBankAccType] = useState('');
  const [bankAccName, setBankAccName] = useState(user?.bank_account_name || '');
  const [bankAccNum, setBankAccNum]   = useState(user?.bank_account_number || '');
  const [bankAccNum2, setBankAccNum2] = useState('');

  /* Step 10 */
  const [docStatus, setDocStatus] = useState({});

  /* Step 11 */
  const [declared, setDeclared] = useState(false);

  /* Pre-fill from existing user data (registration values + any saved vendor_profile) */
  useEffect(() => {
    if (!user) return;

    const vp = user.vendor_profile || {};

    /* Step 1 */
    setOrgType(     vp.step1?.orgType      || '');
    setDateIncorp(  vp.step1?.dateIncorp   || toISODate(user.year_established) || '');
    setCinReg(      vp.step1?.cinReg       || user.registration_number || '');
    setWebsite(     vp.step1?.website      || '');
    setHeadAddr(    vp.step1?.headAddr     || user.address_line1   || '');
    setHeadState(   vp.step1?.headState    || user.state_name      || '');
    setHeadDistrict(vp.step1?.headDistrict || '');
    setHeadCity(    vp.step1?.headCity     || user.city            || '');
    setHeadPin(     vp.step1?.headPin      || user.pincode         || '');

    /* Step 2 */
    setSpocName(    vp.step2?.spocName     || user.first_name      || user.spoc_name || '');
    setSpocDesig(   vp.step2?.spocDesig    || '');
    setAltName(     vp.step2?.altName      || '');
    setAltMobile(   vp.step2?.altMobile    || '');
    setAltEmail(    vp.step2?.altEmail     || '');

    /* Step 3 */
    setPanNo(       vp.step3?.pan          || user.pan             || '');
    setTanNo(       vp.step3?.tan          || '');
    setGstNo(       vp.step3?.gstin        || user.gstin           || '');
    setMsme(        vp.step3?.msme         || '');
    setUdyam(       vp.step3?.udyam        || '');

    /* Step 4 */
    setNsdcCode(    vp.step4?.nsdcCode     || '');
    setAffilType(   vp.step4?.affiliType   || '');
    setSscName(     vp.step4?.sscName      || '');
    setSscAffId(    vp.step4?.sscAffId     || '');
    setAffFrom(     vp.step4?.affFrom      || '');
    setAffTo(       vp.step4?.affTo        || '');
    setIsoCert(     vp.step4?.isoCert      || '');

    /* Step 5 */
    if (vp.step5?.sectors?.length) setSectors(vp.step5.sectors);
    if (vp.step5?.jobRoles?.length) setJobRoles(vp.step5.jobRoles);

    /* Step 6 */
    if (vp.step6?.numCentres) setNumCentres(vp.step6.numCentres);
    if (vp.step6?.centres?.length) { setCentres(vp.step6.centres); setCentreNameErrors(vp.step6.centres.map(() => '')); }

    /* Step 7 */
    setFtTrainers(  vp.step7?.ftTrainers   || '');
    setPtTrainers(  vp.step7?.ptTrainers   || '');
    setTrainerQual( vp.step7?.trainerQual  || '');
    setNumAssessors(vp.step7?.numAssessors || '');
    setAssessorCert(vp.step7?.assessorCert || '');
    setTotalStaff(  vp.step7?.totalStaff   || '');

    /* Step 8 */
    if (vp.step8?.courses?.length) setCourses(vp.step8.courses);

    /* Step 9 */
    setBankName(    vp.step9?.bankName     || '');
    setBankBranch(  vp.step9?.bankBranch   || '');
    setBankIfsc(    vp.step9?.bankIfsc     || user.bank_ifsc       || '');
    setBankAccType( vp.step9?.bankAccType  || '');
    setBankAccName( vp.step9?.bankAccName  || user.bank_account_name || '');
    setBankAccNum(  vp.step9?.bankAccNum   || user.bank_account_number || '');

    /* Step 10 */
    if (vp.step10?.docStatus) setDocStatus(vp.step10.docStatus);
  }, [user?.id]);

  /* ── Validate step ─────────────────────────────────────────── */
  function validateAddress(val) {
    if (!val || !val.trim()) return 'Street Address is required';
    const v = val.trim();
    if (v.length < 10) return 'Address must be at least 10 characters';
    if (/[<>{}|\\^`~\[\]@#$%*=+]/.test(v)) return 'Address contains invalid characters';
    if (/^[^a-zA-Z0-9]/.test(v)) return 'Address must start with a letter or number';
    return '';
  }

  async function lookupPin(pin) {
    if (pin.length !== 6) return;
    setHeadPinLoading(true);
    setHeadPinError('');
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
      const data = await res.json();
      if (data[0]?.Status === 'Success' && data[0]?.PostOffice?.length > 0) {
        const po = data[0].PostOffice[0];
        setHeadState(po.State || headState);
        setHeadDistrict(po.District || headDistrict);
        setHeadCity(po.Division || po.District || headCity);
        setHeadPinError('');
      } else {
        setHeadPinError('PIN code not found in India Post directory. Please verify.');
      }
    } catch {
      setHeadPinError('Could not fetch PIN details. Please fill state and city manually.');
    }
    setHeadPinLoading(false);
  }

  function validateDateIncorp(val) {
    if (!val) return 'Date of Incorporation is required';
    const d = new Date(val);
    const today = new Date(); today.setHours(0,0,0,0);
    if (d > today) return 'Date of Incorporation cannot be a future date';
    if (d < new Date('1900-01-01')) return 'Date of Incorporation seems too old — please enter a valid date (1900 or later)';
    return '';
  }

  function validate() {
    if (step === 1) {
      if (!orgType) return 'Organisation Type is required';
      if (!dateIncorp) { setDateIncorpError('Date of Incorporation is required'); return 'Date of Incorporation is required'; }
      const incorpErr = validateDateIncorp(dateIncorp);
      if (incorpErr) { setDateIncorpError(incorpErr); return incorpErr; }
      if (!(user?.org_name || '').trim()) return 'Organisation Name is required — update your profile';
      if (cinReg) {
        const cinErr = fieldValidate('cin', cinReg);
        if (cinErr) { setCinRegError(cinErr); return cinErr; }
      }
      const addrErr = validateAddress(headAddr);
      if (addrErr) { setHeadAddrError(addrErr); return addrErr; }
      if (!headState) return 'Head Office State is required';
      if (!headCity.trim()) return 'Head Office City is required';
      if (headPin.length !== 6) { setHeadPinError('Valid 6-digit PIN code is required'); return 'Valid 6-digit PIN code is required'; }
    }
    if (step === 2) {
      if (!spocName.trim()) { setSpocNameError('SPOC Name is required'); return 'SPOC Name is required'; }
      const nameErr = fieldValidate('name', spocName);
      if (nameErr) { setSpocNameError(nameErr); return nameErr; }
      if (!spocDesig.trim()) return 'SPOC Designation is required';
    }
    if (step === 3) {
      if (!panNo.trim() || !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(panNo)) {
        setPanError('Invalid PAN — format: ABCDE1234F (10 chars)');
        return 'Valid PAN is required (e.g. ABCDE1234F)';
      }
      if (msme) {
        const msmeErr = fieldValidate('msme', msme);
        if (msmeErr) { setMsmeError(msmeErr); return msmeErr; }
      }
      if (udyam) {
        const udyamErr = fieldValidate('udyam', udyam);
        if (udyamErr) { setUdyamError(udyamErr); return udyamErr; }
      }
    }
    if (step === 5) {
      if (sectors.length === 0) return 'Select at least one Sector';
      if (!jobRoles[0]?.role.trim()) return 'At least one Job Role is required';
    }
    if (step === 6) {
      if (!numCentres || parseInt(numCentres) < 1) return 'At least 1 Training Centre is required';
      const nameErrs = centres.map((c, i) => validateCentreName(c.name, centres, i));
      setCentreNameErrors(nameErrs);
      const first = nameErrs.find(e => e);
      if (first) return first;
    }
    if (step === 8) {
      if (!courses[0]?.name.trim()) return 'At least one Course name is required';
    }
    if (step === 9) {
      if (!bankName.trim()) return 'Bank Name is required';
      if (!bankIfsc.trim()) return 'IFSC Code is required';
      if (!bankAccNum.trim()) return 'Account Number is required';
      if (bankAccNum !== bankAccNum2) return 'Account numbers do not match';
    }
    if (step === 11) {
      if (!declared) return 'Please accept the declaration to proceed';
    }
    return '';
  }

  /* ── Save and advance ──────────────────────────────────────── */
  async function goNext() {
    const err = validate();
    if (err) { setError(err); return; }
    setError('');

    const vp = buildVendorProfile();
    setSaving(true);
    try {
      await api.updateMe({ vendor_profile: vp, pan: panNo, gstin: gstNo, tan: tanNo,
        website,
        bank_ifsc: bankIfsc, bank_account_name: bankAccName, bank_account_number: bankAccNum,
        spoc_name: spocName, year_established: dateIncorp, city: headCity, state_name: headState, pincode: headPin,
        address_line1: headAddr, registration_number: cinReg });
      await refresh();
      if (step === STEPS.length) {
        setDone(true);
      } else {
        setStep(s => s + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  function goBack() {
    setError('');
    setStep(s => Math.max(s - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function buildVendorProfile() {
    const prevVp = user?.vendor_profile || {};
    return {
      completed: step === STEPS.length,
      savedStep: Math.max(step, prevVp.savedStep || 0),
      step1:  { orgType, dateIncorp, cinReg, website, headAddr, headState, headDistrict, headCity, headPin },
      step2:  { spocName, spocDesig, altName, altMobile, altEmail },
      step3:  { pan: panNo, tan: tanNo, gstin: gstNo, msme, udyam },
      step4:  { nsdcCode, affiliType, sscName, sscAffId, affFrom, affTo, isoCert },
      step5:  { sectors, jobRoles },
      step6:  { numCentres, centres },
      step7:  { ftTrainers, ptTrainers, trainerQual, numAssessors, assessorCert, totalStaff },
      step8:  { courses },
      step9:  { bankName, bankBranch, bankIfsc, bankAccType, bankAccName, bankAccNum },
      step10: { docStatus },
    };
  }

  /* ── Centre helpers ──────────────────────────────────────── */
  const CENTRE_NAME_RE = /^[A-Za-z0-9\s&\-]+$/;
  function validateCentreName(name, allCentres, selfIdx) {
    const trimmed = name.trim();
    if (!trimmed) return 'Centre name is required';
    if (trimmed.length < 5) return 'Centre name must be at least 5 characters';
    if (trimmed.length > 50) return 'Centre name must be at most 50 characters';
    if (!CENTRE_NAME_RE.test(trimmed)) return 'Only letters, numbers, spaces, & and - are allowed';
    const lower = trimmed.toLowerCase();
    const dup = allCentres.some((c, idx) => idx !== selfIdx && c.name.trim().toLowerCase() === lower);
    if (dup) return 'Duplicate centre name within the same organisation';
    return '';
  }
  function updateCentre(i, key, val) {
    setCentres(prev => {
      const next = prev.map((c, idx) => idx === i ? { ...c, [key]: key === 'name' ? val : val } : c);
      if (key === 'name') {
        setCentreNameErrors(errs => {
          const e = [...errs];
          e[i] = validateCentreName(val, next, i);
          // re-validate others in case duplicate status changed
          next.forEach((c, idx) => { if (idx !== i) e[idx] = e[idx] ? validateCentreName(c.name, next, idx) : ''; });
          return e;
        });
      }
      return next;
    });
  }
  function addCentre() {
    setCentres(prev => [...prev, { name:'', addr:'', state:'', district:'', city:'', pin:'', area:'', cap:'', lab:'Yes', own:'Owned' }]);
    setCentreNameErrors(prev => [...prev, '']);
  }
  function removeCentre(i) {
    setCentres(prev => {
      const next = prev.filter((_, idx) => idx !== i);
      setCentreNameErrors(errs => {
        const e = errs.filter((_, idx) => idx !== i);
        // re-validate all after removal
        next.forEach((c, idx) => { if (e[idx]) e[idx] = validateCentreName(c.name, next, idx); });
        return e;
      });
      return next;
    });
  }

  /* ── Job role helpers ────────────────────────────────────── */
  function updateJR(i, key, val) { setJobRoles(prev => prev.map((r, idx) => idx === i ? { ...r, [key]: val } : r)); }
  function addJR() { setJobRoles(prev => [...prev, { role:'', nsqf:'', ssc:'' }]); }
  function removeJR(i) { setJobRoles(prev => prev.filter((_, idx) => idx !== i)); }

  /* ── Course helpers ──────────────────────────────────────── */
  function updateCourse(i, key, val) { setCourses(prev => prev.map((c, idx) => idx === i ? { ...c, [key]: val } : c)); }
  function addCourse() { setCourses(prev => [...prev, { name:'', dur:'', nsqf:'', cert:'', mode:'', batch:'' }]); }
  function removeCourse(i) { setCourses(prev => prev.filter((_, idx) => idx !== i)); }

  /* ── Styles ──────────────────────────────────────────────── */
  const SIDEBAR_W = 220;
  const NAV_SECTIONS = [
    { label:'Main', items:[
      { icon:'🏠', text:'Dashboard' },
      { icon:'🏢', text:'Organisation Profile' },
    ]},
    { label:'Training', items:[
      { icon:'📍', text:'Training Centres' },
      { icon:'👨‍🏫', text:'Trainers & Faculty' },
      { icon:'📚', text:'Courses & Curriculum' },
      { icon:'📅', text:'Batch Management' },
    ]},
    { label:'Candidates', items:[
      { icon:'👤', text:'Candidate Management' },
    ]},
    { label:'Assessment', items:[
      { icon:'📋', text:'Assessments' },
    ]},
    { label:'Compliance', items:[
      { icon:'📊', text:'Reports & MIS' },
      { icon:'📁', text:'Documents' },
      { icon:'🎫', text:'Grievance & Support' },
    ]},
  ];

  const S = {
    card: { background:'#fff', border:'1px solid #E2E8F0', borderRadius:14, padding:'26px 30px', marginBottom:16 },
    sthdr: { display:'flex', alignItems:'center', gap:13, paddingBottom:18, marginBottom:20, borderBottom:'1px solid #F1F5F9' },
    navBar: { position: standalone ? 'fixed' : 'sticky', bottom:0, left: standalone ? SIDEBAR_W : 'auto', right: standalone ? 0 : 'auto', width: standalone ? 'auto' : '100%', background:'#fff', borderTop:'1px solid #E2E8F0',
      padding:'12px 24px', display:'flex', justifyContent:'space-between', alignItems:'center', zIndex:50,
      boxShadow:'0 -2px 12px rgba(0,0,0,.08)', boxSizing:'border-box' },
    btnPrimary: { padding:'10px 28px', borderRadius:9, background:'#0A2D6E', color:'#fff', border:'none',
      fontWeight:700, fontSize:14, cursor:'pointer', display:'flex', alignItems:'center', gap:6 },
    btnSuccess: { padding:'10px 28px', borderRadius:9, background:'#0D7A5F', color:'#fff', border:'none',
      fontWeight:700, fontSize:14, cursor:'pointer', display:'flex', alignItems:'center', gap:6 },
    btnBack: { padding:'10px 22px', borderRadius:9, border:'1.5px solid #E2E8F0', background:'#fff',
      color:'#334155', fontWeight:700, fontSize:13, cursor:'pointer' },
    btnSkip: { padding:'10px 18px', borderRadius:9, border:'none', background:'transparent',
      color:'#94A3B8', fontWeight:600, fontSize:13, cursor:'pointer' },
    infoBox: { background:'#EEF2FF', border:'1px solid #C7D2FE', borderRadius:9, padding:'11px 14px',
      fontSize:12.5, color:'#0A2D6E', marginBottom:14, lineHeight:1.6 },
  };

  const initials = (user?.org_name || 'TP').slice(0, 2).toUpperCase();

  const s = STEPS[step - 1];
  const savedStep = user?.vendor_profile?.savedStep || 0;
  const pct = Math.round(savedStep / STEPS.length * 100);

  /* ── Sidebar ─────────────────────────────────────────────── */
  const Sidebar = (
    <aside style={{ width:SIDEBAR_W, background:'#1A56C4', display:'flex', flexDirection:'column',
      position:'fixed', top:0, left:0, bottom:0, zIndex:200, flexShrink:0 }}>
      {/* Brand */}
      <div style={{ padding:'14px 16px', borderBottom:'1px solid rgba(255,255,255,.1)', display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ width:32, height:32, background:'rgba(255,255,255,.18)', borderRadius:6, display:'flex', alignItems:'center',
          justifyContent:'center', fontSize:16, flexShrink:0 }}>🎓</div>
        <div>
          <div style={{ color:'#fff', fontSize:12, fontWeight:700, overflow:'hidden',
            textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:148 }}>{user?.org_name || 'My Organisation'}</div>
          <div style={{ color:'rgba(255,255,255,.5)', fontSize:10 }}>Training Partner</div>
        </div>
      </div>

      {/* Nav items */}
      <nav style={{ flex:1, overflowY:'auto', padding:'8px 0' }}>
        {NAV_SECTIONS.map(sec => (
          <div key={sec.label}>
            <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,.5)', letterSpacing:'.8px',
              padding:'8px 14px 3px', textTransform:'uppercase' }}>{sec.label}</div>
            {sec.items.map(item => (
              <div key={item.text} onClick={() => navigate('/vendor-portal')}
                style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 12px', margin:'1px 6px',
                  borderRadius:6, cursor:'pointer', color:'#fff', fontSize:13, fontWeight:500 }}>
                <span style={{ fontSize:14 }}>{item.icon}</span>
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        ))}

        {/* Complete Profile — active */}
        <div style={{ borderTop:'1px solid rgba(255,255,255,.08)', marginTop:8, paddingTop:4 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 12px', cursor:'pointer',
            borderRadius:8, margin:'6px 8px', color:'#fff',
            background:'rgba(255,255,255,.22)',
            border:'1.5px solid rgba(255,255,255,.3)', fontSize:13, fontWeight:700,
            boxShadow:'0 2px 8px rgba(0,0,0,.18)' }}>
            <span style={{ fontSize:14, width:18, textAlign:'center' }}>✏️</span>
            <span>Complete Profile</span>
          </div>
        </div>
      </nav>

      {/* Footer */}
      <div style={{ padding:'12px 16px', borderTop:'1px solid rgba(255,255,255,.08)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:30, height:30, borderRadius:'50%', background:'rgba(255,255,255,.2)',
            display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#fff', flexShrink:0 }}>
            {initials}
          </div>
          <div style={{ minWidth:0 }}>
            <div style={{ fontSize:11, color:'rgba(255,255,255,.7)', fontWeight:600, overflow:'hidden',
              textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.org_name || 'Training Partner'}</div>
            <div style={{ fontSize:10, color:'rgba(255,255,255,.35)' }}>Profile: {pct}% complete</div>
          </div>
        </div>
      </div>
    </aside>
  );

  /* ── Success screen ──────────────────────────────────────── */
  if (done) {
    const successContent = (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', flex:1, padding:'60px 24px' }}>
        <div style={{ maxWidth:520, textAlign:'center' }}>
          <div style={{ width:88, height:88, background:'#E4F5F2', borderRadius:'50%', display:'flex', alignItems:'center',
            justifyContent:'center', fontSize:44, margin:'0 auto 20px' }}>✅</div>
          <div style={{ fontSize:24, fontWeight:800, color:'#0D7A5F', marginBottom:8 }}>Profile Submitted!</div>
          <div style={{ fontSize:14, color:'#64748B', lineHeight:1.7, marginBottom:24 }}>
            Your Training Partner profile has been submitted for review. You can now access your full portal to manage centres, batches, trainers, candidates and more.
          </div>
          <button style={S.btnPrimary} onClick={() => standalone ? navigate('/vendor-portal') : onDone?.()}>
            Go to Training Portal →
          </button>
        </div>
      </div>
    );
    if (!standalone) return successContent;
    return (
      <div style={{ display:'flex', minHeight:'100vh' }}>
        {Sidebar}
        <div style={{ marginLeft:SIDEBAR_W, flex:1, background:'#F1F5F9', display:'flex', alignItems:'center', justifyContent:'center' }}>
          {successContent}
        </div>
      </div>
    );
  }

  const mainContent = (
    <div style={{ flex:1, display:'flex', flexDirection:'column', background:'#F1F5F9', overflow:'hidden', minHeight:0 }}>
      {/* Content */}
      <div style={{ flex:1, padding:'24px 28px 90px', overflowY:'auto' }}>

        {/* Progress bar */}
        <div style={{ background:'#fff', border:'1px solid #E2E8F0', borderRadius:10, padding:'13px 18px', marginBottom:16 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:7 }}>
            <span style={{ fontSize:13, fontWeight:700, color:'#0A2D6E' }}>Step {step} of {STEPS.length} — {s.title}</span>
            <span style={{ fontSize:12, color:'#7886A6' }}>{pct}% complete</span>
          </div>
          <div style={{ height:6, background:'#E2E8F0', borderRadius:3, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${pct}%`, background:'linear-gradient(90deg,#0A2D6E,#0D7A5F)', borderRadius:3, transition:'width .4s' }} />
          </div>
        </div>

        {/* Step pills */}
        <div style={{ display:'flex', overflowX:'auto', gap:0, marginBottom:18, paddingBottom:2, scrollbarWidth:'none' }}>
          {STEPS.map((st, i) => {
            const done_ = step > st.id, active = step === st.id;
            return (
              <div key={st.id} onClick={() => step > st.id && setStep(st.id)}
                style={{ display:'flex', flexDirection:'column', alignItems:'center', flex:1, minWidth:56,
                  position:'relative', cursor: step > st.id ? 'pointer' : 'default' }}>
                {i > 0 && <div style={{ position:'absolute', top:14, left:'-50%', right:'50%', height:2,
                  background: done_ || active ? '#0A2D6E' : '#DDE3EE', zIndex:0 }} />}
                <div style={{ width:28, height:28, borderRadius:'50%', zIndex:1, position:'relative',
                  display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700,
                  background: done_ ? '#0D7A5F' : active ? '#0A2D6E' : '#F0F4F8',
                  color: done_ || active ? '#fff' : '#94A3B8',
                  border: active ? '2px solid #0A2D6E' : done_ ? '2px solid #0D7A5F' : '2px solid #DDE3EE',
                  boxShadow: active ? '0 0 0 4px rgba(10,45,110,.12)' : 'none' }}>
                  {done_ ? '✓' : st.id}
                </div>
                <div style={{ fontSize:9, color: active ? '#0A2D6E' : done_ ? '#0D7A5F' : '#94A3B8',
                  fontWeight: active ? 700 : 500, textAlign:'center', marginTop:4, lineHeight:1.3, maxWidth:56 }}>
                  {st.title}
                </div>
              </div>
            );
          })}
        </div>

        {/* Main card */}
        <div style={S.card}>
          {/* Step header */}
          <div style={S.sthdr}>
            <div style={{ width:46, height:46, borderRadius:11, background:'#EEF2FF',
              display:'flex', alignItems:'center', justifyContent:'center', fontSize:23 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize:10.5, fontWeight:700, color:'#94A3B8', letterSpacing:.7, textTransform:'uppercase', marginBottom:2 }}>
                Step {step} of {STEPS.length}
              </div>
              <div style={{ fontSize:19, fontWeight:700, color:'#0A2D6E' }}>{s.dynamic ? `${user?.org_name || 'Organisation'} Details` : s.title}</div>
              <div style={{ fontSize:12, color:'#7886A6', marginTop:2 }}>{s.sub}</div>
            </div>
          </div>

          {error && (
            <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:9, padding:'10px 14px',
              color:'#B91C1C', fontSize:13, fontWeight:600, marginBottom:16 }}>⚠ {error}</div>
          )}

          {/* ── STEP 1: Organisation Details ── */}
          {step === 1 && (
            <>
              <G2>
                <F label="Organisation Classification" required>
                  <Sel value={orgType} onChange={e => setOrgType(e.target.value)}>
                    <option value="">Select classification</option>
                    {(orgClassifications.length > 0 ? orgClassifications.map(c => c.name) : ORG_TYPES).map(t => <option key={t}>{t}</option>)}
                  </Sel>
                </F>
                <F label="Date of Incorporation" required>
                  <div style={{ width:'100%' }}>
                    <Inp type="date" value={dateIncorp}
                      min="1900-01-01"
                      max={new Date().toISOString().slice(0,10)}
                      onChange={e => { setDateIncorp(e.target.value); setDateIncorpError(validateDateIncorp(e.target.value)); }}
                      onBlur={e => setDateIncorpError(validateDateIncorp(e.target.value))}
                      style={dateIncorpError ? { border:'1px solid #C0392B' } : {}} />
                    {dateIncorpError && <div style={{ color:'#C0392B', fontSize:11, marginTop:3, fontWeight:500 }}>⚠ {dateIncorpError}</div>}
                  </div>
                </F>
              </G2>
              <G2>
                <F label="CIN / Registration Number" hint="Company ID No. or Society/Trust registration no.">
                  <div style={{ width:'100%' }}>
                    <Inp value={cinReg}
                      onChange={e => { setCinReg(e.target.value.toUpperCase()); setCinRegError(''); }}
                      onBlur={() => { if (cinReg) setCinRegError(fieldValidate('cin', cinReg)); }}
                      placeholder="e.g. U74999MH2020PTC123456"
                      maxLength={21}
                      style={cinRegError ? { border:'1px solid #C0392B' } : {}} />
                    {cinRegError && <div style={{ color:'#C0392B', fontSize:11, marginTop:3, fontWeight:500 }}>⚠ {cinRegError}</div>}
                  </div>
                </F>
                <F label="Website URL">
                  <div style={{ width:'100%' }}>
                    <Inp type="url" value={website}
                      onChange={e => { setWebsite(e.target.value); setWebsiteError(''); }}
                      onBlur={() => { if (website) setWebsiteError(fieldValidate('website', website)); }}
                      placeholder="https://www.example.com" />
                    {websiteError && <div style={{ color:'#C0392B', fontSize:11, marginTop:3, fontWeight:500 }}>⚠ {websiteError}</div>}
                  </div>
                </F>
              </G2>
              <SBox title="🏠 Head Office Address">
                <F label="Street Address" required>
                  <div style={{ width:'100%' }}>
                    <Inp value={headAddr}
                      onChange={e => { setHeadAddr(e.target.value); setHeadAddrError(''); }}
                      onBlur={e => setHeadAddrError(validateAddress(e.target.value))}
                      placeholder="Building no., street name, area/locality"
                      style={headAddrError ? { border:'1px solid #C0392B' } : {}} />
                    {headAddrError && <div style={{ color:'#C0392B', fontSize:11, marginTop:3, fontWeight:500 }}>⚠ {headAddrError}</div>}
                    <div style={{ fontSize:10.5, color:'#94A3B8', marginTop:3 }}>Min 10 characters · No special characters like {'< > { } @ # $ %'}</div>
                  </div>
                </F>
                <F label="PIN Code" required>
                  <div style={{ width:'100%' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <Inp value={headPin}
                        onChange={e => {
                          const v = e.target.value.replace(/\D/g,'').slice(0,6);
                          setHeadPin(v);
                          setHeadPinError('');
                          if (v.length === 6) lookupPin(v);
                        }}
                        placeholder="6-digit PIN" maxLength={6}
                        style={headPinError ? { border:'1px solid #C0392B' } : {}} />
                      {headPinLoading && <span style={{ fontSize:12, color:'#64748B', whiteSpace:'nowrap' }}>🔍 Looking up…</span>}
                      {!headPinLoading && headPin.length === 6 && !headPinError && headState && (
                        <span style={{ fontSize:12, color:'#16A34A', whiteSpace:'nowrap' }}>✅ Verified</span>
                      )}
                    </div>
                    {headPinError && <div style={{ color:'#C0392B', fontSize:11, marginTop:3, fontWeight:500 }}>⚠ {headPinError}</div>}
                    {!headPinError && headPin.length === 6 && !headPinLoading && headState && (
                      <div style={{ fontSize:11, color:'#16A34A', marginTop:3 }}>Auto-filled from India Post directory</div>
                    )}
                  </div>
                </F>
                <G3>
                  <F label="State" required>
                    <Sel value={headState} onChange={e => setHeadState(e.target.value)}>
                      <option value="">Select state</option>
                      {STATES.map(s => <option key={s}>{s}</option>)}
                    </Sel>
                  </F>
                  <F label="District">
                    <Inp value={headDistrict} onChange={e => setHeadDistrict(e.target.value)} placeholder="District" />
                  </F>
                  <F label="City / Town" required>
                    <Inp value={headCity} onChange={e => setHeadCity(e.target.value)} placeholder="City" />
                  </F>
                </G3>
              </SBox>
            </>
          )}

          {/* ── STEP 2: Contact Details ── */}
          {step === 2 && (
            <>
              {(user?.first_name || user?.phone || user?.email) && (
                <div style={{ background:'#F0FDF4', border:'1px solid #A7F3D0', borderRadius:9, padding:'10px 14px', marginBottom:14, fontSize:12, color:'#065F46' }}>
                  ✅ <strong>SPOC name, mobile and email</strong> have been pre-filled from your registration. The mobile and email are verified and cannot be changed here.
                </div>
              )}
              <SBox title="👤 SPOC — Single Point of Contact">
                <G2>
                  <F label="Full Name" required>
                    <div style={{ width:'100%' }}>
                      <Inp value={spocName}
                        onChange={e => { setSpocName(e.target.value); setSpocNameError(''); }}
                        onBlur={e => { const v = e.target.value.trim(); if (!v) setSpocNameError('SPOC Name is required'); else setSpocNameError(fieldValidate('name', v)); }}
                        placeholder="Authorised contact person name"
                        style={spocNameError ? { border:'1px solid #C0392B' } : {}} />
                      {spocNameError && <div style={{ color:'#C0392B', fontSize:11, marginTop:3, fontWeight:500 }}>⚠ {spocNameError}</div>}
                    </div>
                  </F>
                  <F label="Designation" required>
                    <Inp value={spocDesig} onChange={e => setSpocDesig(e.target.value)} placeholder="e.g. CEO / Director / Training Manager" />
                  </F>
                </G2>
                <G2>
                  <F label="Mobile Number" hint="Registered mobile (verified during signup)">
                    <Inp value={user?.phone?.replace(/^\+91/,'') || ''} readOnly />
                  </F>
                  <F label="Email Address" hint="Login email (verified during signup)">
                    <Inp value={user?.email || ''} readOnly />
                  </F>
                </G2>
              </SBox>
              <SBox title="👥 Alternate Contact (Optional)">
                <G2>
                  <F label="Full Name">
                    <div style={{ width:'100%' }}>
                      <Inp value={altName}
                        onChange={e => { setAltName(e.target.value); setAltNameError(''); }}
                        onBlur={e => { const v = e.target.value.trim(); if (v) setAltNameError(fieldValidate('name', v)); }}
                        placeholder="Alternate contact name"
                        style={altNameError ? { border:'1px solid #C0392B' } : {}} />
                      {altNameError && <div style={{ color:'#C0392B', fontSize:11, marginTop:3, fontWeight:500 }}>⚠ {altNameError}</div>}
                    </div>
                  </F>
                  <F label="Mobile">
                    <Inp value={altMobile} onChange={e => setAltMobile(e.target.value.replace(/\D/g,'').slice(0,10))} placeholder="10-digit mobile" maxLength={10} />
                  </F>
                </G2>
                <F label="Email">
                  <div style={{ width:'100%' }}>
                    <Inp type="email" value={altEmail}
                      onChange={e => { setAltEmail(e.target.value); setAltEmailError(''); }}
                      onBlur={() => { if (altEmail) setAltEmailError(fieldValidate('email', altEmail)); }}
                      placeholder="alternate@organisation.com" />
                    {altEmailError && <div style={{ color:'#C0392B', fontSize:11, marginTop:3, fontWeight:500 }}>⚠ {altEmailError}</div>}
                  </div>
                </F>
              </SBox>
            </>
          )}

          {/* ── STEP 3: Legal & Statutory ── */}
          {step === 3 && (
            <>
              {(user?.pan || user?.gstin) && (
                <div style={{ background:'#F0FDF4', border:'1px solid #A7F3D0', borderRadius:9, padding:'10px 14px', marginBottom:14, fontSize:12, color:'#065F46' }}>
                  ✅ <strong>PAN{user?.gstin ? ' and GSTIN' : ''}</strong> pre-filled from your registration. Verify the details match your official certificates exactly.
                </div>
              )}
              <G2>
                <F label="PAN Number" required hint="10-character Permanent Account Number">
                  <div style={{ width:'100%' }}>
                    <Inp value={panNo}
                      onChange={e => { setPanNo(e.target.value.toUpperCase().slice(0,10)); setPanError(''); }}
                      onBlur={() => { if (panNo) setPanError(/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(panNo) ? '' : 'Invalid PAN — format: ABCDE1234F (10 chars)'); }}
                      placeholder="ABCDE1234F" maxLength={10} />
                    {panError && <div style={{ color:'#C0392B', fontSize:11, marginTop:3, fontWeight:500 }}>⚠ {panError}</div>}
                  </div>
                </F>
                <F label="TAN Number" hint="Tax Deduction Account Number">
                  <div style={{ width:'100%' }}>
                    <Inp value={tanNo}
                      onChange={e => { setTanNo(e.target.value.toUpperCase().slice(0,10)); setTanError(''); }}
                      onBlur={() => { if (tanNo) setTanError(/^[A-Z]{4}\d{5}[A-Z]$/.test(tanNo) ? '' : 'Invalid TAN — format: PDES03028F (10 chars)'); }}
                      placeholder="MUMB12345A" maxLength={10} />
                    {tanError && <div style={{ color:'#C0392B', fontSize:11, marginTop:3, fontWeight:500 }}>⚠ {tanError}</div>}
                  </div>
                </F>
              </G2>
              <F label="GSTIN" hint="15-character GST Identification Number">
                <div style={{ width:'100%' }}>
                  <Inp value={gstNo}
                    onChange={e => { setGstNo(e.target.value.toUpperCase().slice(0,15)); setGstError(''); }}
                    onBlur={() => { if (gstNo) setGstError(/^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d]Z[A-Z\d]$/.test(gstNo) ? '' : 'Invalid GSTIN — format: 29AAACT1234A1ZK (15 chars)'); }}
                    placeholder="27AABCU9603R1ZX" maxLength={15} />
                  {gstError && <div style={{ color:'#C0392B', fontSize:11, marginTop:3, fontWeight:500 }}>⚠ {gstError}</div>}
                </div>
              </F>
              <G2>
                <F label="MSME Registration Number" hint="If applicable">
                  <div style={{ width:'100%' }}>
                    <Inp value={msme}
                      onChange={e => { setMsme(e.target.value.toUpperCase()); setMsmeError(''); }}
                      onBlur={() => { if (msme) setMsmeError(fieldValidate('msme', msme)); }}
                      placeholder="MH-MU-00-0000000"
                      maxLength={16}
                      style={msmeError ? { border:'1px solid #C0392B' } : {}} />
                    {msmeError && <div style={{ color:'#C0392B', fontSize:11, marginTop:3, fontWeight:500 }}>⚠ {msmeError}</div>}
                  </div>
                </F>
                <F label="Udyam Registration Number" hint="Udyam Aadhar certificate">
                  <div style={{ width:'100%' }}>
                    <Inp value={udyam}
                      onChange={e => { setUdyam(e.target.value.toUpperCase()); setUdyamError(''); }}
                      onBlur={() => { if (udyam) setUdyamError(fieldValidate('udyam', udyam)); }}
                      placeholder="UDYAM-MH-00-0000000"
                      maxLength={19}
                      style={udyamError ? { border:'1px solid #C0392B' } : {}} />
                    {udyamError && <div style={{ color:'#C0392B', fontSize:11, marginTop:3, fontWeight:500 }}>⚠ {udyamError}</div>}
                  </div>
                </F>
              </G2>
              <div style={S.infoBox}>ℹ️ All statutory registrations will be verified against Government databases before approval. Ensure details match your certificates exactly.</div>
            </>
          )}

          {/* ── STEP 4: Accreditation ── */}
          {step === 4 && (
            <>
              <G2>
                <F label="NSDC Partner Code" hint="Leave blank if not an existing NSDC partner">
                  <Inp value={nsdcCode} onChange={e => setNsdcCode(e.target.value.toUpperCase())} placeholder="e.g. NSDC-TP-00000" />
                </F>
                <F label="Type of Affiliation" required>
                  <Sel value={affiliType} onChange={e => setAffilType(e.target.value)}>
                    <option value="">Select type</option>
                    {AFFIL_TYPES.map(t => <option key={t}>{t}</option>)}
                  </Sel>
                </F>
              </G2>
              <SBox title="🏅 Sector Skill Council (SSC) Details">
                <G2>
                  <F label="SSC Name">
                    <Inp value={sscName} onChange={e => setSscName(e.target.value)} placeholder="e.g. Healthcare Sector Skill Council" />
                  </F>
                  <F label="SSC Affiliation / MOU ID">
                    <Inp value={sscAffId} onChange={e => setSscAffId(e.target.value.toUpperCase())} placeholder="MOU or affiliation number" />
                  </F>
                </G2>
                <G2>
                  <F label="Valid From"><Inp type="date" value={affFrom} onChange={e => setAffFrom(e.target.value)} /></F>
                  <F label="Valid To"><Inp type="date" value={affTo} onChange={e => setAffTo(e.target.value)} /></F>
                </G2>
              </SBox>
              <F label="ISO Certification" hint="e.g. ISO 9001:2015, ISO 29990">
                <Inp value={isoCert} onChange={e => setIsoCert(e.target.value)} placeholder="ISO 9001:2015 / ISO 29990" />
              </F>
            </>
          )}

          {/* ── STEP 5: Sectors & Job Roles ── */}
          {step === 5 && (
            <>
              <F label="Sectors / Industries" required hint="Select one or more NSDC sectors your organisation operates in">
                <Sel value="" onChange={e => { if (e.target.value && !sectors.includes(e.target.value)) setSectors(prev => [...prev, e.target.value]); }}>
                  <option value="">— Click to add a sector —</option>
                  {NSDC_SECTORS.filter(s => !sectors.includes(s)).map(s => <option key={s}>{s}</option>)}
                </Sel>
                <div style={{ display:'flex', flexWrap:'wrap', marginTop:8, minHeight:32 }}>
                  {sectors.map((s, i) => (
                    <Tag key={s} label={s} onRemove={() => setSectors(prev => prev.filter((_, idx) => idx !== i))} />
                  ))}
                </div>
              </F>
              <F label="Job Roles" required hint="NSQF-aligned Qualification Packs (QPs) you offer training for">
                {jobRoles.map((jr, i) => (
                  <SubCard key={i} title={`Job Role #${i+1}`} onRemove={jobRoles.length > 1 ? () => removeJR(i) : null}>
                    <G2>
                      <F label="Job Role / QP Name" required>
                        <Inp value={jr.role} onChange={e => updateJR(i,'role',e.target.value)} placeholder="e.g. General Duty Assistant" />
                      </F>
                      <F label="NSQF Level" required>
                        <Sel value={jr.nsqf} onChange={e => updateJR(i,'nsqf',e.target.value)}>
                          <option value="">Select level</option>
                          {NSQF.map(l => <option key={l}>{l}</option>)}
                        </Sel>
                      </F>
                    </G2>
                    <F label="Sector Skill Council">
                      <Inp value={jr.ssc} onChange={e => updateJR(i,'ssc',e.target.value)} placeholder="SSC governing this job role" />
                    </F>
                  </SubCard>
                ))}
                <AddBtn onClick={addJR}>+ Add another job role</AddBtn>
              </F>
            </>
          )}

          {/* ── STEP 6: Infrastructure ── */}
          {step === 6 && (
            <>
              <F label="Total Number of Training Centres" required hint="Owned, rented or government-allotted centres combined">
                <Inp type="number" value={numCentres} onChange={e => {
                  const n = parseInt(e.target.value) || 1;
                  setNumCentres(String(n));
                  setCentres(prev => {
                    const arr = [...prev];
                    while(arr.length < n) arr.push({ name:'', addr:'', state:'', district:'', city:'', pin:'', area:'', cap:'', lab:'Yes', own:'Owned' });
                    return arr.slice(0, n);
                  });
                }} placeholder="e.g. 5" min={1} />
              </F>
              {centres.map((c, i) => (
                <SubCard key={i} title={`Training Centre #${i+1}`} onRemove={centres.length > 1 ? () => removeCentre(i) : null}>
                  <G2>
                    <F label="Centre Name" required>
                      <div style={{ width:'100%' }}>
                        <Inp value={c.name}
                          onChange={e => updateCentre(i, 'name', e.target.value)}
                          onBlur={e => updateCentre(i, 'name', e.target.value.trim())}
                          placeholder="Centre / campus name"
                          maxLength={50}
                          style={centreNameErrors[i] ? { border:'1px solid #C0392B' } : {}} />
                        {centreNameErrors[i] && <div style={{ color:'#C0392B', fontSize:11, marginTop:3, fontWeight:500 }}>⚠ {centreNameErrors[i]}</div>}
                      </div>
                    </F>
                    <F label="Ownership">
                      <Sel value={c.own} onChange={e => updateCentre(i,'own',e.target.value)}>
                        <option>Owned</option><option>Rented / Leased</option><option>Government Allotted</option>
                      </Sel>
                    </F>
                  </G2>
                  <F label="Full Address"><Inp value={c.addr} onChange={e => updateCentre(i,'addr',e.target.value)} placeholder="Building, street, area" /></F>
                  <G3>
                    <F label="State">
                      <Sel value={c.state} onChange={e => updateCentre(i,'state',e.target.value)}>
                        <option value="">Select state</option>
                        {STATES.map(s => <option key={s}>{s}</option>)}
                      </Sel>
                    </F>
                    <F label="City"><Inp value={c.city} onChange={e => updateCentre(i,'city',e.target.value)} placeholder="City" /></F>
                    <F label="PIN Code"><Inp value={c.pin} onChange={e => updateCentre(i,'pin',e.target.value.replace(/\D/g,'').slice(0,6))} placeholder="PIN" maxLength={6} /></F>
                  </G3>
                  <G3>
                    <F label="Area (sq ft)"><Inp type="number" value={c.area} onChange={e => updateCentre(i,'area',e.target.value)} placeholder="e.g. 3000" /></F>
                    <F label="Seating Capacity"><Inp type="number" value={c.cap} onChange={e => updateCentre(i,'cap',e.target.value)} placeholder="e.g. 40" /></F>
                    <F label="Lab / Workshop">
                      <Sel value={c.lab} onChange={e => updateCentre(i,'lab',e.target.value)}>
                        <option>Yes</option><option>No</option>
                      </Sel>
                    </F>
                  </G3>
                </SubCard>
              ))}
              <AddBtn onClick={addCentre}>+ Add training centre</AddBtn>
            </>
          )}

          {/* ── STEP 7: Faculty & Trainers ── */}
          {step === 7 && (
            <>
              <SBox title="👩‍🏫 Trainer Strength">
                <G2>
                  <F label="Full-time Trainers" required>
                    <Inp type="number" value={ftTrainers} onChange={e => setFtTrainers(e.target.value)} placeholder="e.g. 10" min={0} />
                  </F>
                  <F label="Part-time / Guest Trainers">
                    <Inp type="number" value={ptTrainers} onChange={e => setPtTrainers(e.target.value)} placeholder="e.g. 5" min={0} />
                  </F>
                </G2>
                <F label="Minimum Trainer Qualification" hint="e.g. Graduate in relevant field + 2 years industry experience">
                  <textarea value={trainerQual} onChange={e => setTrainerQual(e.target.value)} rows={2}
                    placeholder="Describe minimum qualification criteria for your trainers"
                    style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #DDE3EE', borderRadius:9,
                      fontSize:13, color:'#0A2D6E', resize:'vertical', fontFamily:'inherit' }} />
                </F>
                <F label="Total Academic Staff">
                  <Inp type="number" value={totalStaff} onChange={e => setTotalStaff(e.target.value)} placeholder="e.g. 25" min={0} />
                </F>
              </SBox>
              <SBox title="📊 Assessors">
                <G2>
                  <F label="Number of Certified Assessors">
                    <Inp type="number" value={numAssessors} onChange={e => setNumAssessors(e.target.value)} placeholder="e.g. 3" min={0} />
                  </F>
                  <F label="Assessor Certification Body">
                    <Inp value={assessorCert} onChange={e => setAssessorCert(e.target.value)} placeholder="e.g. NSDC / SSC / NIELIT" />
                  </F>
                </G2>
              </SBox>
            </>
          )}

          {/* ── STEP 8: Courses & Curriculum ── */}
          {step === 8 && (
            <>
              {courses.map((c, i) => (
                <SubCard key={i} title={`Course / Programme #${i+1}`} onRemove={courses.length > 1 ? () => removeCourse(i) : null}>
                  <F label="Course / Programme Name" required>
                    <Inp value={c.name} onChange={e => updateCourse(i,'name',e.target.value)} placeholder="e.g. General Duty Assistant (Healthcare)" />
                  </F>
                  <G2>
                    <F label="Duration (hours)">
                      <Inp type="number" value={c.dur} onChange={e => updateCourse(i,'dur',e.target.value)} placeholder="e.g. 300" />
                    </F>
                    <F label="NSQF Level">
                      <Sel value={c.nsqf} onChange={e => updateCourse(i,'nsqf',e.target.value)}>
                        <option value="">Select level</option>
                        {NSQF.map(l => <option key={l}>{l}</option>)}
                      </Sel>
                    </F>
                  </G2>
                  <G2>
                    <F label="Certification / Awarding Body">
                      <Inp value={c.cert} onChange={e => updateCourse(i,'cert',e.target.value)} placeholder="e.g. HSSC / NSDC / NIELIT" />
                    </F>
                    <F label="Mode of Delivery">
                      <Sel value={c.mode} onChange={e => updateCourse(i,'mode',e.target.value)}>
                        <option value="">Select mode</option>
                        {DELIVERY.map(m => <option key={m}>{m}</option>)}
                      </Sel>
                    </F>
                  </G2>
                  <G2>
                    <F label="Batch Size"><Inp type="number" value={c.batch} onChange={e => updateCourse(i,'batch',e.target.value)} placeholder="e.g. 30" /></F>
                    <F label="Annual Training Capacity"><Inp type="number" placeholder="Total trainees per year" /></F>
                  </G2>
                </SubCard>
              ))}
              <AddBtn onClick={addCourse}>+ Add another course / programme</AddBtn>
            </>
          )}

          {/* ── STEP 9: Financial Details ── */}
          {step === 9 && (
            <>
              <div style={{ background:'#FEF3C7', border:'1px solid #FDE68A', borderRadius:9, padding:'11px 14px', fontSize:12.5, color:'#92400E', marginBottom:14, lineHeight:1.6 }}>
                ⚠️ Bank account must be in the name of the organisation. This account will be used for all NSDC / Government fund disbursements.
              </div>
              <G2>
                <F label="Bank Name" required><Inp value={bankName} onChange={e => setBankName(e.target.value)} placeholder="e.g. State Bank of India" /></F>
                <F label="Branch Name"><Inp value={bankBranch} onChange={e => setBankBranch(e.target.value)} placeholder="e.g. Connaught Place, New Delhi" /></F>
              </G2>
              <G2>
                <F label="IFSC Code" required hint="11-character code">
                  <Inp value={bankIfsc} onChange={e => setBankIfsc(e.target.value.toUpperCase().slice(0,11))} placeholder="e.g. SBIN0001234" maxLength={11} />
                </F>
                <F label="Account Type" required>
                  <Sel value={bankAccType} onChange={e => setBankAccType(e.target.value)}>
                    <option value="">Select type</option>
                    <option>Current Account</option>
                    <option>Savings Account</option>
                  </Sel>
                </F>
              </G2>
              <F label="Account Holder Name" required hint="Name exactly as per bank records">
                <Inp value={bankAccName} onChange={e => setBankAccName(e.target.value)} placeholder="Organisation name as per bank" />
              </F>
              <G2>
                <F label="Account Number" required>
                  <Inp value={bankAccNum} onChange={e => setBankAccNum(e.target.value.replace(/\D/g,''))} placeholder="Bank account number" />
                </F>
                <F label="Re-enter Account Number" required>
                  <Inp value={bankAccNum2} onChange={e => setBankAccNum2(e.target.value.replace(/\D/g,''))} placeholder="Confirm account number" />
                </F>
              </G2>
            </>
          )}

          {/* ── STEP 10: Document Upload ── */}
          {step === 10 && (
            <>
              <div style={{ border:'1px solid #E2E8F0', borderRadius:10, overflow:'hidden' }}>
                {[
                  { key:'regCert', icon:'📋', label:'Incorporation / Registration Certificate', sub:'Certificate of Incorporation / Society / Trust registration', req:true },
                  { key:'pan',     icon:'🪪', label:'PAN Card Copy',                            sub:'Self-attested copy of organisation PAN card', req:true },
                  { key:'gst',     icon:'📑', label:'GST Registration Certificate',             sub:'GSTN registration document (if applicable)', req:false },
                  { key:'balance', icon:'📊', label:'Audited Balance Sheet',                    sub:'Financial statements for the last 2 financial years', req:false },
                  { key:'board',   icon:'📝', label:'Board Resolution / Authorization Letter',  sub:'Resolution authorising SPOC to sign on behalf of organisation', req:true },
                  { key:'affCert', icon:'🏅', label:'SSC / NSDC Affiliation Certificate',      sub:'Existing SSC or NSDC affiliation document (if applicable)', req:false },
                ].map(d => (
                  <div key={d.key} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'13px 16px', borderBottom:'1px solid #F1F5F9', gap:12 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:12, flex:1 }}>
                      <div style={{ width:36, height:36, background:'#EFF6FF', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>{d.icon}</div>
                      <div>
                        <div style={{ fontSize:13, fontWeight:600, color:'#0A2D6E' }}>
                          {d.label}
                          {d.req
                            ? <span style={{ fontSize:9.5, fontWeight:700, color:'#EF4444', background:'#FEF2F2', border:'1px solid #FECACA', padding:'2px 6px', borderRadius:99, marginLeft:6 }}>Required</span>
                            : <span style={{ fontSize:9.5, fontWeight:600, color:'#7886A6', background:'#F1F5F9', border:'1px solid #E2E8F0', padding:'2px 6px', borderRadius:99, marginLeft:6 }}>Optional</span>
                          }
                        </div>
                        <div style={{ fontSize:11, color:'#94A3B8', marginTop:1 }}>{d.sub} · PDF / JPG / PNG · Max 5 MB</div>
                      </div>
                    </div>
                    {docStatus[d.key]
                      ? <span style={{ padding:'7px 14px', borderRadius:8, border:'1.5px solid #6EE7B7', background:'#ECFDF5', color:'#065F46', fontSize:12, fontWeight:700, flexShrink:0 }}>✓ Uploaded</span>
                      : <button type="button" onClick={() => setDocStatus(prev => ({ ...prev, [d.key]: true }))}
                          style={{ padding:'7px 14px', borderRadius:8, border:'1.5px dashed #93C5FD', background:'#F0F7FF', color:'#1D4ED8', fontSize:12, fontWeight:600, cursor:'pointer', flexShrink:0 }}>
                          ↑ Upload
                        </button>
                    }
                  </div>
                ))}
              </div>
              <SBox title="📷 Infrastructure Photos" style={{ marginTop:14 }}>
                <div style={{ fontSize:12.5, color:'#7886A6', marginBottom:10 }}>Upload photos of your training centres — classrooms, labs, entrance. Max 5 photos, JPG/PNG.</div>
                <button type="button"
                  style={{ padding:'8px 16px', borderRadius:8, border:'1.5px dashed #93C5FD', background:'#F0F7FF', color:'#1D4ED8', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                  📷 Add Centre Photos
                </button>
              </SBox>
            </>
          )}

          {/* ── STEP 11: Declaration & Submit ── */}
          {step === 11 && (
            <>
              {/* Summary */}
              <div style={{ background:'#ECFDF5', border:'1px solid #A7F3D0', borderRadius:10, padding:'15px 17px', marginBottom:16 }}>
                <div style={{ fontSize:10.5, fontWeight:700, color:'#065F46', letterSpacing:.5, textTransform:'uppercase', marginBottom:12 }}>📋 Application Summary</div>
                <div style={{ display:'grid', gridTemplateColumns:'140px 1fr', gap:'5px 10px', fontSize:13 }}>
                  {[
                    ['Organisation',  user?.org_name || '—'],
                    ['Org Type',      orgType || '—'],
                    ['SPOC',          spocName ? `${spocName}${spocDesig ? ` (${spocDesig})` : ''}` : '—'],
                    ['Mobile',        user?.phone || '—'],
                    ['Email',         user?.email || '—'],
                    ['PAN',           panNo || '—'],
                    ['Affiliation',   affiliType || '—'],
                    ['Sectors',       sectors.join(', ') || '—'],
                    ['Job Roles',     jobRoles.map(j => j.role).filter(Boolean).join(', ') || '—'],
                    ['Centres',       `${centres.length} centre(s)`],
                    ['Courses',       courses.map(c => c.name).filter(Boolean).join(', ') || '—'],
                  ].map(([k, v]) => (
                    <><span style={{ color:'#94A3B8', fontWeight:500 }}>{k}</span><span style={{ color:'#0A2D6E', fontWeight:600 }}>{v}</span></>
                  ))}
                </div>
              </div>

              {/* Declaration */}
              <div style={{ background:'#FFFBEB', border:'1px solid #FDE68A', borderRadius:10, padding:'15px 17px', marginBottom:16 }}>
                <div style={{ fontSize:10.5, fontWeight:700, color:'#92400E', letterSpacing:.5, textTransform:'uppercase', marginBottom:8 }}>📜 Declaration by Authorised Signatory</div>
                <p style={{ fontSize:12, color:'#292524', lineHeight:1.8, marginBottom:12 }}>
                  I / We hereby declare that all information furnished in this application is true, correct and complete to the best of my / our knowledge and belief.
                  I / We agree to comply with all guidelines, norms, standards and SOPs prescribed by SkillsnJobs.
                  I / We authorise SkillsnJobs to verify submitted information from any relevant authority or organisation.
                  I / We agree to submit periodic compliance reports and undergo audits as required by SkillsnJobs or its authorised agencies.
                </p>
                <label style={{ display:'flex', alignItems:'flex-start', gap:9, cursor:'pointer' }}>
                  <input type="checkbox" checked={declared} onChange={e => setDeclared(e.target.checked)}
                    style={{ width:15, height:15, marginTop:2, cursor:'pointer', flexShrink:0 }} />
                  <span style={{ fontSize:13, color:'#0A2D6E', fontWeight:600, lineHeight:1.5 }}>
                    I accept the above declaration and confirm that all submitted information is accurate and I am authorised to make this application on behalf of the organisation.
                    <span style={{ color:'#EF4444', marginLeft:2 }}>*</span>
                  </span>
                </label>
              </div>
            </>
          )}
          </div>{/* closes S.card */}
        </div>{/* closes scrollable */}

      {/* Fixed nav bar */}
      <div style={S.navBar}>
        <div>
          {step > 1 && (
            <button style={S.btnBack} onClick={goBack}>← Back</button>
          )}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ fontSize:11, color:'#94A3B8' }}>{step} / {STEPS.length}</span>
          {step < STEPS.length
            ? <button style={S.btnPrimary} onClick={goNext} disabled={saving}>
                {saving ? 'Saving…' : 'Save & Continue →'}
              </button>
            : <button style={S.btnSuccess} onClick={goNext} disabled={saving}>
                {saving ? 'Submitting…' : '✓ Submit Registration'}
              </button>
          }
        </div>
      </div>
    </div>
  );

  if (!standalone) return mainContent;

  return (
    <div style={{ display:'flex', minHeight:'100vh' }}>
      {Sidebar}
      <div style={{ marginLeft:SIDEBAR_W, flex:1, display:'flex', flexDirection:'column', background:'#F1F5F9' }}>
        {/* Topbar */}
        <div style={{ height:56, background:'#fff', borderBottom:'1px solid #E2E8F0', display:'flex', alignItems:'center',
          justifyContent:'space-between', padding:'0 24px', position:'sticky', top:0, zIndex:100,
          boxShadow:'0 1px 4px rgba(10,45,110,.06)' }}>
          <div style={{ fontSize:13, color:'#64748B', fontWeight:500 }}>Complete Profile</div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ padding:'4px 12px', borderRadius:20, background:'#FEF6E4', border:'1px solid #FDE68A',
              fontSize:12, fontWeight:700, color:'#9A6A00' }}>Profile {pct}% complete</div>
            <span style={{ fontSize:12, color:'#94A3B8' }}>TP-{user?.id || '—'}</span>
            <div style={{ width:34, height:34, borderRadius:'50%', background:'linear-gradient(130deg,#0A2D6E,#0D7A5F)',
              border:'2px solid #E2E8F0', color:'#fff', fontWeight:700, fontSize:13,
              display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{initials}</div>
            <button onClick={() => { logout(); window.location.href = '/login'; }}
              style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 14px', borderRadius:7,
                border:'1px solid #E2E8F0', background:'#fff', color:'#64748B', fontSize:12, fontWeight:600, cursor:'pointer' }}>
              ⏻ Sign Out
            </button>
          </div>
        </div>
        {mainContent}
      </div>
    </div>
  );
}
